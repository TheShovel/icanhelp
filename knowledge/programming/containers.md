# Linux Container Technologies

## Container Runtimes

### runc (OCI Runtime)

```bash
# Low-level runtime
# Creates container from OCI bundle

# Create bundle
mkdir mycontainer
cd mycontainer
mkdir rootfs
# ... populate rootfs ...

# Generate config.json
runc spec

# Edit config.json for your needs
# Then run
runc run mycontainer
```

### containerd

```bash
# High-level runtime with image management
# Used by Kubernetes

# CLI: ctr
ctr images pull docker.io/library/nginx:latest
ctr run --rm -t docker.io/library/nginx:latest nginx

# Or use nerdctl (Docker-compatible CLI)
nerdctl pull nginx
nerdctl run -d -p 80:80 nginx

# Namespaces
ctr ns ls
ctr -n k8s.io c ls

# Images
ctr images ls
ctr images pull docker.io/library/alpine:latest
ctr images export alpine.tar docker.io/library/alpine:latest

# Containers
ctr containers ls
ctr tasks ls
```

### CRI-O

```bash
# Kubernetes-focused, lightweight
# Implements CRI (Container Runtime Interface)

# CLI: crictl (works with any CRI runtime)
crictl pull nginx
crictl run nginx
crictl ps
crictl logs <container-id>
crictl exec -it <container-id> sh
```

### Docker Engine

```bash
# Full platform (client + daemon + CLI)
docker pull nginx
docker run -d -p 80:80 nginx
docker ps
docker logs <container>
docker exec -it <container> sh
docker build -t myapp .
docker push myapp
```

## Container Images

### OCI Image Format

```
Image Manifest (application/vnd.oci.image.manifest.v1+json)
├── Config (application/vnd.oci.image.config.v1+json)
│   ├── Architecture, OS
│   ├── Entrypoint, Cmd
│   ├── Env, WorkingDir
│   ├── User, ExposedPorts
│   ├── Labels
│   └── RootFS (diff_ids)
└── Layers (application/vnd.oci.image.layer.v1.tar+gzip)
    ├── sha256:abc123...
    ├── sha256:def456...
    └── sha256:ghi789...
```

### Building Images

```dockerfile
# Dockerfile
FROM alpine:3.19 AS builder
RUN apk add --no-cache go
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o myapp

FROM scratch
COPY --from=builder /app/myapp /myapp
USER 1000:1000
ENTRYPOINT ["/myapp"]
```

```bash
# Build with BuildKit (faster, better caching)
DOCKER_BUILDKIT=1 docker build -t myapp .

# Multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .

# Build without Docker daemon (kaniko, buildah)
buildah bud -t myapp .
kaniko --context . --destination myapp
```

### Image Optimization

```dockerfile
# Use minimal base
FROM alpine:3.19  # ~5MB
# or
FROM gcr.io/distroless/static  # ~2MB, no shell
# or
FROM scratch  # Empty, static binary only

# Combine RUN commands
RUN apk add --no-cache pkg1 pkg2 && \
    rm -rf /var/cache/apk/*

# Use .dockerignore
# .dockerignore
.git
node_modules
*.log
tests/

# Multi-stage builds
FROM golang:1.22 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app

FROM gcr.io/distroless/static
COPY --from=builder /app /app
ENTRYPOINT ["/app"]

# Layer caching: put infrequently changing layers first
COPY go.mod go.sum ./
RUN go mod download
COPY . .
```

## Container Networking

### CNI (Container Network Interface)

```bash
# CNI plugins: bridge, host-device, ipvlan, macvlan, ptp, vlan, loopback
# IPAM plugins: host-local, dhcp, static

# Example bridge config
cat > /etc/cni/net.d/10-bridge.conf <<EOF
{
  "cniVersion": "0.4.0",
  "name": "bridge",
  "type": "bridge",
  "bridge": "cni0",
  "isGateway": true,
  "ipMasq": true,
  "ipam": {
    "type": "host-local",
    "subnet": "10.10.0.0/16",
    "routes": [
      { "dst": "0.0.0.0/0" }
    ]
  }
}
EOF
```

### Network Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `bridge` | Default, isolated bridge | Standard containers |
| `host` | Share host network | High performance, legacy apps |
| `none` | No network | Secure, isolated |
| `container:<id>` | Share another container's net | Sidecars |
| `macvlan` | Direct MAC on physical | Bare-metal performance |
| `ipvlan` | L2/L3 virtual interfaces | Multi-tenant |

### Service Discovery

```bash
# CoreDNS (Kubernetes)
# Automatic DNS for services

# Consul
# Service mesh with DNS/HTTP API

# etcd
# Key-value store for service registry

# Docker Compose
# Service names resolve automatically
```

## Storage

### Volume Drivers

```bash
# Local
docker volume create myvol
docker run -v myvol:/data myapp

# Bind mount
docker run -v /host/path:/container/path myapp

# tmpfs (memory)
docker run --tmpfs /run --tmpfs /tmp myapp

# NFS
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/exports/data nfsvol

# Cloud (AWS EBS, GCP PD, Azure Disk)
# Via CSI drivers in Kubernetes
```

### Kubernetes Volumes

```yaml
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd

---
# Pod using PVC
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: myapp
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc
```

## Security

### Namespaces

```bash
# Linux namespaces isolate resources
# Types: pid, net, mnt, uts, ipc, user, cgroup, time

# View process namespaces
ls -l /proc/$$/ns/
ls -l /proc/<pid>/ns/

# Enter namespace
nsenter -t <pid> -n -m -p -u -i

# unshare (create new namespaces)
unshare -n -m -p -u -f --mount-proc /bin/bash
```

### Capabilities

```bash
# Drop all, add only needed
docker run --cap-drop=ALL --cap-add=CAP_NET_BIND_SERVICE myapp

# Common capabilities
CAP_NET_BIND_SERVICE  # Bind to ports < 1024
CAP_SYS_ADMIN         # Mount, namespace ops (DANGEROUS)
CAP_SYS_RESOURCE      # Resource limits
CAP_DAC_OVERRIDE      # Bypass file permissions
CAP_CHOWN             # Change file ownership

# Check process caps
getpcaps <pid>
capsh --decode=<hex>
```

### Seccomp

```bash
# Default profile blocks ~50 syscalls
# Custom profile
cat > seccomp.json <<EOF
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {"names": ["read", "write", "exit", "exit_group"], "action": "SCMP_ACT_ALLOW"}
  ]
}
EOF

docker run --security-opt seccomp=seccomp.json myapp
```

### AppArmor

```bash
# Profile
# /etc/apparmor.d/docker-myapp
#include <tunables/global>

profile docker-myapp flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  network inet tcp,
  network inet udp,
  deny network raw,
  deny network packet,
  file rw,
  deny /etc/shadow r,
  deny /etc/gshadow r,
}

# Load
apparmor_parser -r /etc/apparmor.d/docker-myapp

# Use
docker run --security-opt apparmor=docker-myapp myapp
```

### SELinux

```bash
# Labels
# system_u:object_r:container_file_t:s0 - container images
# system_u:object_r:container_var_lib_t:s0 - /var/lib/docker
# system_u:system_r:container_runtime_t:s0 - container runtime

# Run with label
docker run --security-opt label=type:container_runtime_t myapp

# Multi-level security
docker run --security-opt label=level:s0:c123,c456 myapp
```

### Rootless Containers

```bash
# Podman (daemonless, rootless)
podman run -d -p 8080:80 nginx

# Docker rootless
dockerd-rootless-setuptool.sh install
systemctl --user start docker
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock

# RootlessKit (used by rootless Docker/Podman)
# Maps root in container to unprivileged user on host
```

### Image Signing

```bash
# cosign (Sigstore)
cosign generate-key-pair
cosign sign -key cosign.key myimage:latest
cosign verify -key cosign.pub myimage:latest

# Notary v2
notary init myimage
notary add myimage v1
notary sign myimage v1
```

## Kubernetes CRI

```yaml
# Container Runtime Interface
# kubelet communicates via gRPC

# Runtime classes
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc

# Pod spec
spec:
  runtimeClassName: gvisor
```

## Containerd Configuration

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
      
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runsc]
        runtime_type = "io.containerd.runsc.v1"

[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
      endpoint = ["https://registry-1.docker.io"]
```

## Debugging Containers

```bash
# Inspect container
docker inspect <container>
ctr -n k8s.io c info <container>

# Logs
docker logs -f <container>
crictl logs -f <container>

# Exec
docker exec -it <container> sh
crictl exec -it <container> sh

# Network
docker exec <container> ss -tuln
docker exec <container> ip route
crictl exec <container> ip addr

# Filesystem
docker diff <container>
docker cp <container>:/path /local/path

# Resources
docker stats <container>
crictl stats <container>

# Debug with ephemeral container (K8s)
kubectl debug -it <pod> --image=busybox --target=<container>

# nsenter (host-level debugging)
PID=$(docker inspect --format '{{.State.Pid}}' <container>)
nsenter -t $PID -n -m -p -u -i
```

## Performance

### Resource Limits

```bash
# CPU
docker run --cpus=2 --cpu-shares=1024 myapp
# --cpuset-cpus=0-3

# Memory
docker run --memory=2g --memory-swap=4g myapp
# --memory-swappiness=0

# Block I/O
docker run --device-read-bps=/dev/sda:10mb myapp
docker run --device-write-iops=/dev/sda:1000 myapp

# PIDs
docker run --pids-limit=100 myapp

# Ulimits
docker run --ulimit nofile=65536:65536 myapp
```

### Monitoring

```bash
# cAdvisor (container metrics)
docker run -d -p 8080:8080 \
  -v /:/rootfs:ro -v /var/run:/var/run:ro \
  -v /sys:/sys:ro -v /var/lib/docker:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor

# Prometheus metrics
# cadvisor:8080/metrics

# Node Exporter + cAdvisor dashboards in Grafana
```

## Troubleshooting

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Container exits immediately | `docker logs` | Fix entrypoint, add `tail -f /dev/null` |
| OOM Killed | `docker inspect` OOMKilled=true | Increase memory limit, fix leak |
| Cannot bind port | `netstat -tuln` | Port in use, use different port |
| DNS not working | `cat /etc/resolv.conf` | Check host DNS, use `--dns` |
| Permission denied | `ls -la` in container | Fix UID/GID mapping, chown |
| Image pull fails | `docker pull` error | Check auth, registry, network |
| Slow startup | `time docker run` | Optimize image, check health checks |
| Container stuck | `docker top`, `docker exec` | Check process, deadlock |

## Tools

| Tool | Purpose |
|------|---------|
| `docker` / `nerdctl` | CLI for containers |
| `buildah` / `kaniko` | Build images without daemon |
| `skopeo` | Copy/inspect images between registries |
| `crictl` | CRI-compatible CLI |
| `ctr` | containerd CLI |
| `podman` | Rootless, daemonless containers |
| `dive` | Analyze image layers |
| `hadolint` | Lint Dockerfiles |
| `trivy` / `grype` / `syft` | Scan vulnerabilities |
| `cosign` | Sign/verify images |