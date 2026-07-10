# Linux Container Runtimes

## Container Runtime Comparison
- **Docker**: most popular, full toolchain (build, ship, run). Daemon (`dockerd`), CLI, Docker Hub
- **Podman**: daemonless, rootless by default, Docker-compatible CLI (alias `docker=podman`)
  - No central daemon — each container is a child process of podman
  - Built-in systemd integration: `systemd --user` to run containers as user services
  - Pods: share network namespace (like Kubernetes pods) — `podman pod create`
- **containerd**: industry-standard OCI runtime, used by Docker and Kubernetes (via CRI)
  - CLI: `nerdctl` — Docker-compatible, supports containerd-specific features
- **CRI-O**: lightweight CRI implementation for Kubernetes only (not general-purpose)
- **LXC/LXD**: system containers (full OS, not app containers) — closer to VMs

## Podman Deep Dive

### Basic Usage
```bash
podman pull nginx:alpine
podman run -d -p 8080:80 nginx:alpine
podman ps
podman exec -it <container> sh
podman logs -f <container>
```

### Rootless Containers
- Default for non-root users — no `sudo` needed
- User namespaces: container uid 0 maps to host uid (e.g., 1000)
- Limitations: cannot bind to ports < 1024, limited capabilities
- Workaround for < 1024 ports: `sysctl net.ipv4.ip_unprivileged_port_start=80` or use reverse proxy
- Rootless podman stores containers in `~/.local/share/containers/`

### Pods (Kubernetes-style)
```bash
podman pod create --name mypod -p 8080:80
podman run -d --pod mypod nginx
podman run -d --pod mypod redis
podman pod list
podman pod stop mypod
```

### Systemd Integration
```bash
# Generate systemd unit for existing container
podman generate systemd --name mycontainer > ~/.config/systemd/user/mycontainer.service
systemctl --user daemon-reload
systemctl --user enable --now mycontainer.service
journalctl --user -u mycontainer.service
```

## Container Security

### Dropping Capabilities
```bash
# Docker / Podman
--cap-drop=ALL
--cap-add=NET_BIND_SERVICE   # add back only what's needed
```

### Seccomp Profiles
- Default Docker seccomp profile blocks ~44 of ~300 syscalls
- Custom profile: `--security-opt seccomp=custom.json`
- Podman default is more restrictive than Docker

### Read-Only Rootfs
```bash
--read-only                                # rootfs is read-only
--tmpfs /tmp                               # writable tmp for specific dirs
--tmpfs /var/run                           # runtime data
```

### User Namespace Remapping
```bash
# Docker: /etc/docker/daemon.json
{ "userns-remap": "default" }   # maps to dockremap user

# Podman: built-in (always rootless by default)
```

## Building Images
```dockerfile
# Multi-stage build (common pattern)
FROM rust:1.70 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/myapp /usr/local/bin/
CMD ["myapp"]
```

```bash
# Podman/Docker build
podman build -t myapp:latest .
podman build --layers=false .              # no layer caching
podman build --no-cache .                  # force rebuild

# Distroless images: google/distroless, chainguard/static
# Alpine: ~5MB but uses musl libc (C binaries may not work)
# Debian slim: ~80MB, glibc-compatible
```

## Storage & Networking

### Storage Drivers
- **overlay2**: default, fast, copy-on-write (recommended)
- **devicemapper**: legacy, avoid
- **btrfs/zfs**: native filesystem snapshots
- **vfs**: no copy-on-write, for testing only

### Network Drivers
- **bridge**: default, isolated network, port forwarding
- **host**: container uses host network (no isolation, better perf)
- **macvlan**: assign MAC address to container (appears as separate device)
- **none**: loopback only

```bash
# Custom bridge network
podman network create mynet
podman run -d --network mynet --name web nginx
podman run -d --network mynet redis
# Containers can now reach each other by name
```

## Common Troubleshooting
- `podman logs <container>` — check output
- `podman inspect <container>` — detailed config + state
- `podman top <container>` — processes inside container
- `podman stats` — live resource usage (CPU, mem, net, block)
- `nerdctl ps -a` — list all containerd containers
- `crictl ps` — list containers managed by CRI (kubelet)
- `ctr images ls` — containerd raw image list

## Podman vs Docker Commands
| Docker | Podman | Notes |
|---|---|---|
| `docker run` | `podman run` | Same flags, no daemon |
| `docker-compose up` | `podman-compose up` | Third-party tool |
| `docker system prune` | `podman system prune` | Same behavior |
| `docker swarm` | — | No swarm in Podman (use Kube) |
| `docker buildx` | `podman build` | BuildKit vs Buildah backend |
| `docker login` | `podman login` | Same registries |
| — | `podman pod` | No pod concept in Docker |
