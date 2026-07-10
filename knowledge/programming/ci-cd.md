# CI/CD Pipelines & Automation

## Core Concepts
- **Continuous Integration (CI)**: automatically build, lint, test every commit/push
- **Continuous Delivery (CD)**: automatically deploy to staging after CI passes
- **Continuous Deployment**: automatically deploy to production after tests pass
- Pipeline stages typically: lint → build → unit test → integration test → deploy
- Artifacts: compiled binaries, Docker images, packages passed between stages
- Secrets management: store credentials in CI provider vault, not in code

## GitHub Actions

### Basic Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run coverage

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
```

### Common Actions
- `actions/checkout@v4` — checkout repository
- `actions/setup-node@v4` / `actions/setup-python@v5` — language runtimes
- `actions/cache@v4` — cache node_modules, pip, Maven deps
- `actions/upload-artifact@v4` — store build outputs
- `docker/login-action@v3` — authenticate to container registry
- `docker/build-push-action@v6` — build and push Docker images
- `aws-actions/configure-aws-credentials@v4` — AWS auth via OIDC

### Matrix Builds
```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]
        exclude:
          - os: windows-latest
            node: 18
    runs-on: ${{ matrix.os }}
```

## GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - validate
  - build
  - test
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

lint:
  stage: validate
  image: node:20
  script:
    - npm ci
    - npm run lint

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE

deploy_prod:
  stage: deploy
  only:
    - main
  script:
    - kubectl set image deployment/app app=$DOCKER_IMAGE
  environment:
    name: production
```

## Docker Multi-stage Builds for CI
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production image (small)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Environment Management
- **Development**: local, hot-reload, debug logs, mock services
- **Staging**: mirrors production, uses real services, final test gate
- **Production**: live traffic, strict access, monitored, rollback plan
- Feature flags: toggle features without deployment (LaunchDarkly, Unleash)

## Deployment Strategies
- **Rolling update**: replace instances one by one (zero downtime)
- **Blue/green**: run two identical environments, switch traffic instantly
- **Canary**: route small % of traffic to new version, ramp up if stable
- **Feature branch deploy**: preview environments per PR (Netlify, Vercel, Railway)

## CI/CD Best Practices
- Pipeline should fail fast — run most likely-to-fail checks first
- Cache dependencies between runs (npm cache, Maven local repo, pip cache)
- Use commit SHA-based tags for Docker images (not `latest`)
- Pin CI runner versions (e.g., `ubuntu-22.04` not `ubuntu-latest`)
- Generate SBOM (Software Bill of Materials) for supply chain security
- Run security scanning: `npm audit`, `trivy`, `snyk`, `semgrep`
- Store pipeline configs in version control (pipeline-as-code)
- Use OIDC instead of long-lived service account keys where possible

## Common CI Tools & Services
| Tool | Type | Key Features |
|------|------|-------------|
| GitHub Actions | Cloud | Deep GitHub integration, reusable workflows |
| GitLab CI | Cloud/Self-hosted | Built-in container registry, Kubernetes |
| Jenkins | Self-hosted | Highly customizable, vast plugin ecosystem |
| CircleCI | Cloud | Fast parallel execution, caching |
| Drone | Self-hosted | Lightweight, YAML config, Docker-native |
| Woodpecker | Self-hosted | Fork of Drone, open-source |
| Buildkite | Hybrid | Agents on your infra, pipeline in Git |
