# Container Technologies Deep Dive

## Overview
Containers provide OS-level virtualization for packaging applications with their dependencies. They share the host kernel but isolate processes, filesystems, and networks.

## Core Concepts

### Container vs VM
| Aspect | Containers | Virtual Machines |
|--------|------------|------------------|
| Isolation | Process-level (namespaces) | Hardware-level (hypervisor) |
| Kernel | Shared with host | Guest OS kernel |
| Startup | Milliseconds | Minutes |
| Density | High (100s per host) | Low (10s per host) |
| Overhead | Near-native | 5-15% performance cost |
| Security | Weaker (shared kernel) | Stronger (hardware isolation) |

### Linux Namespaces (Isolation Primitives)
| Namespace | Isolates | Clone Flag |
|-----------|----------|------------|
| PID | Process IDs | CLONE_NEWPID |
| NET | Network stack | CLONE_NEWNET |
| MNT | Mount points | CLONE_NEWNS |
| UTS | Hostname/domain | CLONE_NEWUTS |
| IPC | IPC resources | CLONE_NEWIPC |
| USER | User/group IDs | CLONE_NEWUSER |
| CGROUP | Cgroup hierarchy | CLONE_NEWCGROUP |
| TIME | System time | CLONE_NEWTIME |

### Cgroups (Control Groups) - Resource Limits
```bash
# v2 unified hierarchy (modern)
/sys/fs/cgroup/
├── docker/
│   ├── container-id/
│   │   ├── cgroup.procs
│   │   ├── memory.max
│   │   ├── cpu.max
│   │   ├── io.max
│   │   └── pids.max

# Memory limit
echo 512M > /sys/fs/cgroup/docker/container-id/memory.max

# CPU limit (quota/period)
echo "50000 100000" > /sys/fs/cgroup/docker/container-id/cpu.max  # 0.5 CPU

# I/O limit (device: read_bps write_bps)
echo "8:0 1048576 1048576" > /sys/fs/cgroup/docker/container-id/io.max
```

## Docker Deep Dive

### Image Layers (Union Filesystem)
```
Dockerfile:
FROM ubuntu:22.04          # Layer 1: Base OS
RUN apt-get update         # Layer 2: Package cache
RUN apt-get install -y nginx  # Layer 3: Nginx install
COPY . /app               # Layer 4: Application code
CMD ["nginx", "-g", "daemon off;"]  # Metadata

# Each RUN/COPY/ADD creates a layer
# Layers are cached and shared
# Final image = overlayfs mount of all layers
```

### Dockerfile Best Practices
```dockerfile
# Use specific tags, not latest
FROM node:20-alpine AS builder

# Build stage
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage (smaller)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node  # Non-root
EXPOSE 3000
CMD ["node", "server.js"]

# Multi-stage for compiled languages
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /app /app
ENTRYPOINT ["/app"]
```

### BuildKit (Modern Builder)
```bash
# Enable
export DOCKER_BUILDKIT=1
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .

# Features:
# - Parallel builds
# - Cache mounts (npm, pip, cargo)
# - Secret mounts (SSH keys, tokens)
# - Output to OCI/registry
# - Build caching to registry
```

```dockerfile
# syntax = docker/dockerfile:1.4
FROM node:20-alpine
# Cache npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline
# Secret (SSH key for private repo)
RUN --mount=type=ssh git clone git@github.com:org/private.git
```

### Runtime Options
```bash
# Resource limits
docker run --memory=512m --cpus=1.5 --pids-limit=100 myapp

# Security
docker run --read-only --tmpfs /tmp --tmpfs /run \
  --cap-drop=ALL --cap-add=NET_BIND_SERVICE \
  --security-opt=no-new-privileges \
  --user 1000:1000 myapp

# Networking
docker run --network=host myapp          # Host network
docker run --network=none myapp          # No network
docker run -p 8080:80 --name web myapp   # Port mapping

# Logging
docker run --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 myapp

# Health checks
docker run --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 myapp
```

## Container Runtimes

### containerd (CNCF Graduated)
```bash
# CLI: ctr, crictl, nerdctl
# Used by: Docker, Kubernetes, AWS Fargate

# Architecture:
# containerd (daemon) → runc (OCI runtime) → container
#       ↓
#   shim (per container) → reaper, stdio, signals

# CRI plugin for Kubernetes
# Plugin architecture: snapshotter, runtime, networking
```

### CRI-O (Kubernetes Native)
```bash
# Lightweight, CRI-only runtime
# No Docker dependencies
# Used by OpenShift, OKD

# Features:
# - OCI image format
# - runc/crun/Kata Containers
# - CNI networking
# - Minimal attack surface
```

### runc (OCI Reference Runtime)
```bash
# Low-level container execution
# Implements OCI Runtime Spec

# Run container from bundle
mkdir bundle
cd bundle
# Create config.json (OCI spec)
runc create mycontainer
runc start mycontainer

# Rootless
runc --rootless create mycontainer
```

### Alternative Runtimes
| Runtime | Use Case | Isolation |
|---------|----------|-----------|
| **crun** | Faster runc (C) | Standard |
| **Kata Containers** | VM-level isolation | Hardware virt |
| **gVisor** | User-space kernel | Syscall interception |
| **Firecracker** | MicroVMs (AWS Lambda) | KVM |
| **WasmEdge** | WebAssembly workloads | Wasm sandbox |

## Kubernetes Container Runtime Interface (CRI)

### CRI Architecture
```
kubelet → CRI (gRPC) → containerd/CRI-O
                ↓
         Image Service (pull, remove)
         Runtime Service (run, stop, exec, logs)
```

### Containerd Config for Kubernetes
```toml
# /etc/containerd/config.toml
version = 2
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.k8s.io/pause:3.9"
  [plugins."io.containerd.grpc.v1.cri".containerd]
    snapshotter = "overlayfs"
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
        runtime_type = "io.containerd.runc.v2"
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
          SystemdCgroup = true
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.kata]
        runtime_type = "io.containerd.kata.v2"
```

## Image Standards

### OCI Image Spec
```
Image Layout (v1):
blobs/
  sha256/<digest>  # Layer tarballs + config
oci-layout         # Version file
index.json         # Manifest list (multi-arch)

Manifest (application/vnd.oci.image.manifest.v1+json):
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {"digest": "sha256:...", "size": 1234, "mediaType": "..."},
  "layers": [
    {"digest": "sha256:...", "size": 32456789, "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip"}
  ],
  "annotations": {"org.opencontainers.image.title": "myapp"}
}
```

### Multi-Arch Images
```bash
# Build and push multi-arch
docker buildx create --use --name multiarch
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myregistry/myapp:v1.0 \
  --push .

# Inspect manifest
docker buildx imagetools inspect myregistry/myapp:v1.0
```

### Image Signing (Cosign/Sigstore)
```bash
# Install cosign
cosign generate-key-pair

# Sign
cosign sign --key cosign.key myregistry/myapp:v1.0

# Verify
cosign verify --key cosign.pub myregistry/myapp:v1.0

# Keyless (OIDC)
cosign sign myregistry/myapp@v1.0
cosign verify myregistry/myapp@v1.0
```

## Security

### Image Scanning
```bash
# Trivy (Aqua)
trivy image myapp:v1.0
trivy fs --security-checks vuln,config,secret /path/to/code

# Grype (Anchore)
grype myapp:v1.0

# Syft (SBOM)
syft myapp:v1.0 -o spdx-json=sbom.spdx.json

# Docker Scout
docker scout cves myapp:v1.0
```

### Runtime Security (Falco)
```yaml
# Falco rules example
- rule: Shell in Container
  desc: Detect shell spawn in container
  condition: >
    container and proc.name in (bash, sh, zsh, ksh, fish)
    and not user_known_shell_activity
  output: "Shell in container (user=%user.name container=%container.name)"
  priority: WARNING
```

### Seccomp Profiles
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_X32"],
  "syscalls": [
    {"names": ["read", "write", "open", "close"], "action": "SCMP_ACT_ALLOW"},
    {"names": ["execve", "clone", "fork"], "action": "SCMP_ACT_ERRNO"}
  ]
}
```

```bash
docker run --security-opt seccomp=profile.json myapp
```

### AppArmor/SELinux
```bash
# AppArmor (Ubuntu/Debian)
docker run --security-opt apparmor=my-profile myapp

# SELinux (RHEL/Fedora)
docker run --security-opt label=type:container_runtime_t myapp
```

## Networking

### CNI (Container Network Interface)
```bash
# Plugins chain: main → ipam → bandwidth → portmap → firewall → tuning

# Common CNI plugins:
# - bridge (default Docker)
# - macvlan (direct L2)
# - ipvlan (L2/L3, no MAC conflicts)
# - calico (BGP, network policy)
# - cilium (eBPF, L7 policy)
# - flannel (VXLAN overlay)
# - weave (mesh overlay)
```

### Service Mesh (Sidecar)
```
Application Pod
├── app-container
└── sidecar-proxy (Envoy) → mTLS, traffic management, observability

Control Plane: Istio, Linkerd, Consul Connect
```

## Storage

### Volume Types
```yaml
# Kubernetes volumes
volumes:
  - name: data
    emptyDir: {}           # Ephemeral, pod lifetime
  - name: config
    configMap:
      name: app-config
  - name: secret
    secret:
      secretName: app-secret
  - name: persistent
    persistentVolumeClaim:
      claimName: pvc-data
  - name: host
    hostPath:
      path: /var/lib/app
      type: DirectoryOrCreate
```

### CSI (Container Storage Interface)
```
External Provisioner → CSI Driver → Storage Backend
         ↓
   Kubernetes API
```

## Orchestration

### Kubernetes Pod Spec
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:v1.0
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    emptyDir: {}
  securityContext:
    runAsNonRoot: true
    fsGroup: 1000
```

### Init Containers
```yaml
initContainers:
- name: init-db
  image: busybox
  command: ['sh', '-c', 'until nslookup db; do sleep 1; done']
- name: migrate
  image: myapp:migrate
  command: ['python', 'manage.py', 'migrate']
```

## Development Workflows

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### Dev Containers (VS Code)
```json
// .devcontainer/devcontainer.json
{
  "name": "My Project",
  "build": { "dockerfile": "Dockerfile" },
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/docker-in-docker:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
    }
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install"
}
```

## Monitoring & Debugging

### crictl (Kubernetes CRI CLI)
```bash
# List pods
crictl pods

# List containers
crictl ps -a

# Inspect
crictl inspect <container-id>

# Logs
crictl logs -f <container-id>

# Exec
crictl exec -it <container-id> sh

# Stats
crictl stats
```

### ctr (containerd CLI)
```bash
# Images
ctr images ls
ctr images pull docker.io/library/nginx:latest
ctr images export nginx.tar docker.io/library/nginx:latest

# Containers
ctr containers ls
ctr tasks ls

# Snapshots
ctr snapshots ls
```

### nerdctl (Docker-compatible CLI for containerd)
```bash
# Full Docker CLI compatibility
nerdctl run -d --name web -p 8080:80 nginx
nerdctl compose up -d
nerdctl build -t myapp .
nerdctl images
nerdctl system df
```

## Performance Tuning

### Kernel Parameters
```bash
# /etc/sysctl.d/99-container.conf
# Connection tracking
net.netfilter.nf_conntrack_max = 1000000
net.netfilter.nf_conntrack_tcp_timeout_established = 86400

# Network
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192

# Filesystem
fs.inotify.max_user_watches = 1048576
fs.inotify.max_user_instances = 8192

# Memory
vm.max_map_count = 262144
vm.swappiness = 10
```

### Container Density Optimization
```yaml
# Resource quotas per namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    pods: "500"
    services: "100"
```

## Tools Ecosystem

| Category | Tools |
|----------|-------|
| **Build** | Docker, BuildKit, Buildah, Kaniko, Podman |
| **Registry** | Harbor, GHCR, ECR, GCR, Quay, Nexus, JFrog |
| **Runtime** | containerd, CRI-O, runc, Kata, gVisor, Firecracker |
| **Orchestration** | Kubernetes, Nomad, Docker Swarm, ECS |
| **Networking** | Calico, Cilium, Flannel, Weave, Multus |
| **Storage** | CSI drivers, Longhorn, Rook, Portworx |
| **Security** | Trivy, Grype, Cosign, Kyverno, OPA Gatekeeper, Falco |
| **Observability** | cAdvisor, Prometheus, Grafana, Jaeger, Loki |
| **Debugging** | crictl, nerdctl, kubectl debug, netshoot |

## Resources
- [OCI Specifications](https://github.com/opencontainers)
- [Kubernetes CRI](https://kubernetes.io/docs/concepts/architecture/cri/)
- [Containerd Documentation](https://containerd.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [CNCF Landscape](https://landscape.cncf.io/)