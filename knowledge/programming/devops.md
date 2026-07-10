# DevOps & Site Reliability

## CI/CD Pipelines
- **Continuous Integration**: merge frequently → auto-build + auto-test → catch bugs early
- **Continuous Delivery**: every passing build is deployable (manual approval for production)
- **Continuous Deployment**: every passing build goes to production automatically

### Pipeline Stages
1. **Source**: trigger on push/PR (GitHub, GitLab, Bitbucket)
2. **Build**: compile, bundle, containerize (Docker build, Maven, Webpack)
3. **Test**: unit, integration, lint, security scan
4. **Deploy**: staging → approval gate → production
5. **Verify**: smoke tests, health checks, canary analysis

### Common CI/CD Tools
- **GitHub Actions**: YAML workflows, hosted runners, huge marketplace
- **GitLab CI**: `.gitlab-ci.yml`, built-in registry, auto DevOps
- **Jenkins**: mature, plugin ecosystem, Groovy pipeline DSL
- **CircleCI**: fast, parallelism, orbs for reusable config
- **ArgoCD**: GitOps for Kubernetes (sync cluster state with Git repo)
- **Tekton**: Kubernetes-native CI/CD, custom resources

## Infrastructure as Code (IaC)
- **Terraform / OpenTofu**: declarative, HCL, state file, plan/apply
  ```
  terraform init          # initialize backend + providers
  terraform plan          # preview changes
  terraform apply         # apply changes
  terraform destroy       # tear down everything
  ```
- **Ansible**: agentless, YAML playbooks, push-based
- **Pulumi**: IaC with real programming languages (TS, Python, Go, C#)
- **CloudFormation**: AWS-native, JSON/YAML, stacks + nested stacks
- **Helm**: Kubernetes package manager, charts + templates

## Monitoring & Observability
- **Four golden signals**: latency, traffic, errors, saturation
- **USE method**: Utilization, Saturation, Errors (for resources)
- **RED method**: Rate, Errors, Duration (for services)

### Metrics, Logs, Traces
- **Prometheus** + **Grafana**: metrics collection, alerting, dashboards
  - PromQL: `rate(http_requests_total[5m])`, `histogram_quantile(0.95, ...)`
- **Loki**: log aggregation (like Prometheus but for logs)
- **OpenTelemetry**: unified traces + metrics + logs (vendor-neutral)
- **Datadog**: SaaS monitoring (APM, infrastructure, logs)
- **New Relic**: APM-focused, distributed tracing

### Health Checks & Alerting
```yaml
# Kubernetes liveness/readiness probe
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```
- **Alertmanager**: deduplicates, routes, silences Prometheus alerts
- **PagerDuty/OpsGenie**: on-call schedules, escalation policies
- **Dead Man's Switch**: alert if monitoring itself goes down

## Configuration Management
- **12-Factor App**: store config in environment variables, not code
- **Consul**: service discovery + KV store
- **Vault**: secrets management (dynamic secrets, encryption, access control)
- **etcd**: distributed key-value store (used by Kubernetes)
- **SOPS**: encrypted files decrypted at deploy time

## Containers & Orchestration
- **Docker**: build once, run anywhere (see docker.md)
- **Kubernetes**: container orchestration (see kubernetes.md)
- **Podman**: daemonless alternative to Docker, rootless by default
- **containerd**: industry-standard container runtime (used by Docker, Kubernetes)

## Incident Response
1. **Detect**: alert, dashboard, user report
2. **Triage**: severity (SEV1 = down, SEV2 = degraded, SEV3 = minor)
3. **Mitigate**: rollback, scale out, feature flag, traffic shift
4. **Resolve**: fix root cause, deploy fix
5. **Learn**: postmortem (blameless), action items, update runbooks

### Postmortem Template
- Summary, timeline, impact, root cause, action items
- Blameless culture: "what broke" not "who broke it"
- SLO targets: e.g. 99.9% uptime → ~8.7h downtime/year allowed

## SRE Practices
- **SLI** (Service Level Indicator): measured metric (e.g. latency p99 < 200ms)
- **SLO** (Service Level Objective): target (e.g. 99.9% requests < 200ms)
- **SLA** (Service Level Agreement): contractual commitment
- **Error budget**: 100% - SLO = acceptable failure (e.g. 0.1% = ~43min/month)
- **Toil**: manual, repetitive work — automate or eliminate
- **Chaos engineering**: deliberately inject failures to test resilience (Chaos Monkey, Litmus)

## Common DevOps Tools
- **Docker Compose**: local multi-container setup (docker-compose.yml)
- **Kustomize**: native Kubernetes YAML overlays (no templates)
- **Skaffold**: continuous development for Kubernetes
- **Tilt**: dev environment for microservices
- **Crossplane**: control plane for managing infrastructure from Kubernetes
- **Packer**: create identical machine images for multiple platforms
- **Vagrant**: reproducible dev environments (VirtualBox, libvirt)
- **mlr** (Miller): `mlr --csv cut -f name,age data.csv` — CSV/JSON processing
- **yq**: `yq eval '.spec.replicas' deploy.yaml` — YAML query tool
