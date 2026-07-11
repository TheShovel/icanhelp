# CI/CD Pipeline Best Practices

## Pipeline Stages

### 1. Source/Trigger
```yaml
# Trigger on push to main, tags, PRs
trigger:
  branches:
    include:
      - main
      - release/*
  tags:
    include:
      - v*
  paths:
    include:
      - src/**
      - Dockerfile
      - docker-compose.yml
    exclude:
      - docs/**
      - README.md
```

### 2. Build & Test
```yaml
jobs:
- job: BuildAndTest
  pool:
    vmImage: 'ubuntu-latest'
  steps:
  # Cache dependencies
  - task: Cache@2
    inputs:
      key: 'npm | $(Agent.OS) | package-lock.json'
      path: $(Pipeline.Workspace)/.npm
    displayName: 'Cache npm packages'
  
  # Install
  - script: npm ci
    displayName: 'Install dependencies'
  
  # Lint
  - script: npm run lint
    displayName: 'Lint'
  
  # Type check
  - script: npm run typecheck
    displayName: 'Type check'
  
  # Unit tests with coverage
  - script: npm run test:coverage
    displayName: 'Unit tests'
  
  # Publish coverage
  - task: PublishCodeCoverageResults@1
    inputs:
      codeCoverageTool: 'Cobertura'
      summaryFileLocation: '$(Build.SourcesDirectory)/coverage/cobertura-coverage.xml'
  
  # Build artifact
  - script: npm run build
    displayName: 'Build'
  
  # Publish artifact
  - publish: $(Build.SourcesDirectory)/dist
    artifact: drop
```

### 3. Security Scanning
```yaml
- job: SecurityScan
  steps:
  # SAST (Static Application Security Testing)
  - task: SonarCloudPrepare@1
    inputs:
      SonarCloud: 'SonarCloud'
      organization: 'myorg'
      scannerMode: 'CLI'
      configMode: 'manual'
      cliProjectKey: 'myorg_myproject'
      cliSources: '.'
  
  - task: SonarCloudAnalyze@1
  
  # Dependency scanning
  - script: npm audit --audit-level=high
    displayName: 'npm audit'
  
  # Container scanning
  - task: Docker@2
    inputs:
      command: 'build'
      dockerfile: 'Dockerfile'
      tags: |
        $(Build.Repository.Name):$(Build.BuildNumber)
    displayName: 'Build image'
  
  - script: |
      trivy image --severity HIGH,CRITICAL $(Build.Repository.Name):$(Build.BuildNumber)
    displayName: 'Trivy scan'
  
  # Secret scanning
  - script: |
      gitleaks detect --source . --verbose
    displayName: 'Gitleaks'
```

### 4. Container Build & Push
```yaml
- job: BuildImage
  dependsOn: BuildAndTest
  condition: succeeded()
  steps:
  - checkout: self
    clean: true
  
  - task: Docker@2
    inputs:
      command: 'buildAndPush'
      repository: 'myapp'
      dockerfile: 'Dockerfile'
      tags: |
        $(Build.BuildNumber)
        latest
      buildContext: '.'
    displayName: 'Build and push image'
  
  # Sign image (cosign)
  - script: |
      cosign sign --yes ${REGISTRY}/myapp:$(Build.BuildNumber)
    displayName: 'Sign image'
    env:
      REGISTRY: ${{ variables.REGISTRY }}
      COSIGN_PASSWORD: $(cosign.password)
```

### 5. Deploy to Staging
```yaml
- job: DeployStaging
  dependsOn: BuildImage
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  environment: 'staging'
  steps:
  - download: current
    artifact: drop
  
  - task: KubernetesManifest@0
    inputs:
      action: 'deploy'
      kubernetesServiceConnection: 'k8s-staging'
      namespace: 'staging'
      manifests: |
        $(Pipeline.Workspace)/manifests/deployment.yaml
        $(Pipeline.Workspace)/manifests/service.yaml
      containers: |
        ${{ variables.REGISTRY }}/myapp:$(Build.BuildNumber)
    displayName: 'Deploy to staging'
  
  # Smoke tests
  - script: |
      curl -f https://staging.myapp.com/health
    displayName: 'Smoke test'
    retryCountOnTaskFailure: 3
```

### 6. Integration/E2E Tests
```yaml
- job: IntegrationTests
  dependsOn: DeployStaging
  steps:
  - script: |
      npx playwright install
      npx playwright test --project=chromium
    displayName: 'E2E tests'
    env:
      BASE_URL: https://staging.myapp.com
```

### 7. Deploy to Production
```yaml
- job: DeployProduction
  dependsOn: IntegrationTests
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  environment: 'production'
  # Manual approval gate
  timeoutInMinutes: 60
  steps:
  - task: KubernetesManifest@0
    inputs:
      action: 'deploy'
      kubernetesServiceConnection: 'k8s-production'
      namespace: 'production'
      manifests: |
        $(Pipeline.Workspace)/manifests/deployment.yaml
        $(Pipeline.Workspace)/manifests/service.yaml
      containers: |
        ${{ variables.REGISTRY }}/myapp:$(Build.BuildNumber)
      strategy: 'rolling'
      rollingUpdateMaxSurge: '25%'
      rollingUpdateMaxUnavailable: '0%'
    displayName: 'Deploy to production'
  
  # Post-deploy verification
  - script: |
      # Wait for rollout
      kubectl rollout status deployment/myapp -n production --timeout=5m
      # Health check
      curl -f https://myapp.com/health
    displayName: 'Verify deployment'
```

### 8. Rollback
```yaml
# Manual rollback job
- job: RollbackProduction
  condition: failed()
  steps:
  - task: KubernetesManifest@0
    inputs:
      action: 'rollback'
      kubernetesServiceConnection: 'k8s-production'
      namespace: 'production'
      manifests: |
        $(Pipeline.Workspace)/manifests/deployment.yaml
    displayName: 'Rollback production'
```

## GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Test
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build-image:
    needs: lint-test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
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
          platforms: linux/amd64,linux/arm64

  deploy-staging:
    needs: build-image
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_STAGING }}
      
      - name: Update image
        run: |
          kubectl set image deployment/myapp myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} -n staging
          kubectl rollout status deployment/myapp -n staging --timeout=5m

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/myapp myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} -n production
          kubectl rollout status deployment/myapp -n production --timeout=5m
```

## Best Practices

### Pipeline Performance
```yaml
# Parallel jobs
jobs:
  - job: UnitTests
  - job: IntegrationTests
  - job: Lint
  # All run in parallel

# Matrix builds
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]

# Caching
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Self-hosted runners for large builds
runs-on: [self-hosted, linux, x64, gpu]
```

### Secrets Management
```yaml
# Never hardcode secrets
# Use: GitHub Secrets, Azure Key Vault, HashiCorp Vault, AWS Secrets Manager

# Reference in pipeline
env:
  DB_PASSWORD: $(db-password)  # From secret variable
  API_KEY: ${{ secrets.API_KEY }}

# In Kubernetes
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  db-password: ${DB_PASSWORD}  # Injected by CI
```

### Environment Promotion
```yaml
# Use same artifacts across environments
# Build once, deploy many
artifacts:
  - name: app-image
    type: docker
    tag: v1.2.3

# Promote same tag through environments
staging:  v1.2.3
production: v1.2.3  # Same image!
```

### Testing Strategy
```
Unit Tests (Fast, Isolated)
    ↓
Integration Tests (DB, Cache, External APIs mocked)
    ↓
Contract Tests (Pact - consumer driven)
    ↓
E2E Tests (Real environment, critical paths only)
    ↓
Performance Tests (k6, JMeter)
    ↓
Chaos Engineering (Litmus, Chaos Mesh)
```

### Monorepo Pipelines
```yaml
# Only build changed projects
- task: Nx@1
  inputs:
    command: 'run-many'
    targets: 'build,test,lint'
    projects: 'affected'
    parallel: 3
```

### Pipeline as Code
```yaml
# Template for reuse
# templates/build.yml
parameters:
  serviceName: ''
  dockerfile: 'Dockerfile'

jobs:
- job: Build_${{ parameters.serviceName }}
  steps:
  - task: Docker@2
    inputs:
      command: buildAndPush
      repository: ${{ parameters.serviceName }}
      dockerfile: ${{ parameters.dockerfile }}

# Main pipeline
jobs:
- template: templates/build.yml
  parameters:
    serviceName: 'api'
    dockerfile: 'services/api/Dockerfile'

- template: templates/build.yml
  parameters:
    serviceName: 'worker'
    dockerfile: 'services/worker/Dockerfile'
```

## Monitoring Pipeline Health

### Metrics to Track
- **Lead Time**: Commit → Production
- **Deployment Frequency**: Deployments/day
- **Change Failure Rate**: Failed deployments / total
- **MTTR**: Mean time to recovery

### Dashboards
```yaml
# Grafana dashboard for CI/CD
metrics:
  - pipeline_duration_seconds
  - pipeline_success_rate
  - deployment_frequency
  - change_failure_rate
  - mttr_minutes
```

### Alerting
```yaml
# Alert on
- Pipeline failure rate > 10% in 1h
- Deployment duration > 30min
- No deployment to prod in 24h (if main has changes)
- Security scan failures
```

## GitOps Integration

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/manifests
    targetRevision: HEAD
    path: apps/myapp/overlays/production
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
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### CI updates GitOps repo
```yaml
# In CI pipeline after successful build
- name: Update GitOps manifest
  run: |
    cd manifests
    kustomize edit set image myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    git config user.name "ci-bot"
    git config user.email "ci@company.com"
    git commit -am "Update myapp to ${{ github.sha }}"
    git push
```

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Long pipeline times | Parallelize, cache, optimize tests |
| Flaky tests | Quarantine, fix or delete |
| Manual approvals slow | Auto-promote with gates |
| Secrets in logs | Mask secrets, use secret stores |
| Drift between envs | Same artifacts, GitOps |
| No rollback plan | Automated rollback on health check fail |
| Testing in prod only | Staging must mirror prod |
| Single pipeline for all | Separate pipelines per service |