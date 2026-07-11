# CI/CD Pipeline Design

## Pipeline Stages

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │───▶│  Build  │───▶│  Test   │───▶│ Staging │───▶│Production│
│ Commit  │    │         │    │         │    │ Deploy  │    │ Deploy   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                 │              │              │              │
           Compile,         Unit,          Deploy to       Blue/Green,
           Lint, Scan       Integration,   Staging Env     Canary,
           Security         E2E,           Smoke Tests     Rollback
                           Contract
```

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==================== BUILD & LINT ====================
  build-and-lint:
    name: Build & Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
      
      - name: Install dependencies
        run: |
          pip install -e ".[dev]"
      
      - name: Run Ruff (lint + format)
        run: |
          ruff check .
          ruff format --check .
      
      - name: Run MyPy
        run: mypy src/
      
      - name: Run Bandit (security)
        run: bandit -r src/ -f json -o bandit-report.json || true
      
      - name: Upload Bandit report
        uses: actions/upload-artifact@v4
        with:
          name: bandit-report
          path: bandit-report.json

  # ==================== TEST ====================
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: build-and-lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: [6379:6379]
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
      
      - name: Install dependencies
        run: pip install -e ".[dev]"
      
      - name: Run unit tests
        run: |
          pytest tests/unit -v --cov=src --cov-report=xml --cov-fail-under=80
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: pytest tests/integration -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  # ==================== CONTRACT TESTS ====================
  contract-test:
    name: Contract Tests
    runs-on: ubuntu-latest
    needs: build-and-lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Pact tests
        run: |
          pytest tests/contract -v
      
      - name: Publish contracts
        if: github.ref == 'refs/heads/main'
        run: |
          pact-broker publish pacts --broker-base-url $PACT_BROKER_URL
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

  # ==================== SECURITY ====================
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: build-and-lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy (container)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Snyk (dependencies)
        uses: snyk/actions/node@master
        with:
          command: test
          args: --severity-threshold=high

  # ==================== BUILD IMAGE ====================
  build-image:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [test, contract-test, security-scan]
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== STAGING DEPLOY ====================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-image
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Kubernetes (Staging)
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_STAGING }}
      
      - name: Update image tag
        run: |
          kubectl set image deployment/myapp \
            myapp=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -n staging
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/myapp -n staging --timeout=300s
      
      - name: Run smoke tests
        run: |
          pytest tests/smoke -v --base-url=https://staging.example.com

  # ==================== PRODUCTION DEPLOY ====================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-image
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Kubernetes (Production)
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_PROD }}
      
      - name: Blue-Green Deploy
        run: |
          # Deploy to green namespace
          kubectl set image deployment/myapp-green \
            myapp=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -n production-green
          
          kubectl rollout status deployment/myapp-green -n production-green --timeout=300s
          
          # Smoke test green
          pytest tests/smoke -v --base-url=https://green.example.com
          
          # Switch traffic
          kubectl patch service myapp -n production \
            -p '{"spec":{"selector":{"version":"green"}}}'
          
          # Verify
          pytest tests/smoke -v --base-url=https://example.com
          
          # Cleanup old blue
          kubectl delete deployment myapp-blue -n production-blue --ignore-not-found

  # ==================== ROLLBACK ====================
  rollback:
    name: Rollback Production
    runs-on: ubuntu-latest
    if: failure()
    needs: deploy-production
    environment: production
    steps:
      - name: Rollback to previous version
        run: |
          kubectl rollout undo deployment/myapp -n production
          kubectl rollout status deployment/myapp -n production --timeout=300s
```

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - security
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: $CI_REGISTRY
  IMAGE_NAME: $CI_REGISTRY_IMAGE

# Cache dependencies
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .cache/pip/
    - .cache/uv/

# Validate Stage
lint:
  stage: validate
  image: python:3.11-slim
  before_script:
    - pip install uv
    - uv pip install -e ".[dev]" --cache-dir .cache/uv
  script:
    - uv run ruff check .
    - uv run ruff format --check .
    - uv run mypy src/
  artifacts:
    reports:
      codequality: gl-code-quality-report.json

security-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy fs --format sarif --output trivy.sarif .
  artifacts:
    reports:
      sast: trivy.sarif

# Test Stage
unit-tests:
  stage: test
  image: python:3.11-slim
  services:
    - postgres:16
    - redis:7
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/testdb
    REDIS_URL: redis://redis:6379
  before_script:
    - pip install uv
    - uv pip install -e ".[dev]" --cache-dir .cache/uv
  script:
    - uv run pytest tests/unit -v --cov=src --cov-report=xml --cov-fail-under=80
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        path: coverage.xml
        format: cobertura

integration-tests:
  stage: test
  image: python:3.11-slim
  services:
    - postgres:16
    - redis:7
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/testdb
    REDIS_URL: redis://redis:6379
  script:
    - uv run pytest tests/integration -v

# Build Stage
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
  only:
    - main
    - develop
    - tags

# Deploy Stages
deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/myapp myapp=$IMAGE_NAME:$CI_COMMIT_SHA -n staging
    - kubectl rollout status deployment/myapp -n staging --timeout=300s
    - curl -f https://staging.example.com/health
  only:
    - develop

deploy-production:
  stage: deploy-production
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://example.com
  when: manual
  script:
    - kubectl config use-context production
    - |
      # Blue-green deploy
      kubectl set image deployment/myapp-green myapp=$IMAGE_NAME:$CI_COMMIT_SHA -n production
      kubectl rollout status deployment/myapp-green -n production --timeout=300s
      curl -f https://green.example.com/health
      kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"green"}}}'
      curl -f https://example.com/health
  only:
    - main
    - tags
```

## ArgoCD GitOps

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/myapp-config
    targetRevision: HEAD
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../../base

patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: myapp
      spec:
        replicas: 5
  - patch: |-
      apiVersion: v1
      kind: Service
      metadata:
        name: myapp
      spec:
        type: LoadBalancer

images:
  - name: myapp
    newTag: "v1.2.3"
```

## Deployment Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -euo pipefail

NAMESPACE="production"
SERVICE="myapp"
NEW_VERSION=$1

BLUE_DEPLOYMENT="${SERVICE}-blue"
GREEN_DEPLOYMENT="${SERVICE}-green"

# Determine current active
CURRENT=$(kubectl get service $SERVICE -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
if [ "$CURRENT" = "blue" ]; then
    ACTIVE=$BLUE_DEPLOYMENT
    STANDBY=$GREEN_DEPLOYMENT
    NEW_VERSION_LABEL="green"
else
    ACTIVE=$GREEN_DEPLOYMENT
    STANDBY=$BLUE_DEPLOYMENT
    NEW_VERSION_LABEL="blue"
fi

echo "Current active: $ACTIVE"
echo "Deploying to standby: $STANDBY"

# Update standby deployment
kubectl set image deployment/$STANDBY $SERVICE=$NEW_VERSION -n $NAMESPACE
kubectl label deployment/$STANDBY version=$NEW_VERSION_LABEL -n $NAMESPACE --overwrite

# Wait for rollout
kubectl rollout status deployment/$STANDBY -n $NAMESPACE --timeout=300s

# Health check standby
STANDBY_POD=$(kubectl get pods -n $NAMESPACE -l app=$SERVICE,version=$NEW_VERSION_LABEL -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n $NAMESPACE $STANDBY_POD -- curl -f http://localhost:8000/health

# Switch traffic
kubectl patch service $SERVICE -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"app\":\"$SERVICE\",\"version\":\"$NEW_VERSION_LABEL\"}}}"

# Verify
sleep 10
curl -f https://example.com/health

echo "Deployment successful!"
```

### Canary Deployment

```yaml
# Istio Canary
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp
  http:
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: myapp
        subset: v2
      weight: 100
  - route:
    - destination:
        host: myapp
        subset: v1
      weight: 90
    - destination:
        host: myapp
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp
spec:
  host: myapp
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

### Argo Rollouts (Kubernetes Native)

```yaml
# rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 30
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 100
      canaryMetadata:
        labels:
          role: canary
      stableMetadata:
        labels:
          role: stable
      trafficRouting:
        istio:
          virtualService:
            name: myapp
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v1.0.0
        ports:
        - containerPort: 8000
```

## Best Practices

| Practice | Why |
|----------|-----|
| **Fast feedback** | Fail fast, fix fast |
| **Single source of truth** | Git as source for all environments |
| **Immutable artifacts** | Same image promotes through pipeline |
| **Automated rollback** | Reduce MTTR |
| **Test in production-like env** | Catch env-specific issues |
| **Security scanning** | Shift left security |
| **Contract testing** | Prevent breaking changes |
| **Observability** | Know when things break |
| **Documentation as code** | Keep docs in sync |
| **Regular pipeline review** | Continuous improvement |

## Pipeline Metrics

| Metric | Target |
|--------|--------|
| Build time | < 10 min |
| Test execution | < 15 min |
| Deploy time | < 5 min |
| Lead time (commit to prod) | < 1 hour |
| Deployment frequency | Daily+ |
| Change failure rate | < 15% |
| MTTR | < 1 hour |
| Availability | > 99.9% |