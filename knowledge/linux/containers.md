# Linux Container Runtimes

## Runtime Comparison
- **Docker**: full toolchain, daemon (`dockerd`).
- **Podman**: daemonless, rootless by default, Docker-compatible CLI.
- **containerd**: OCI runtime used by Kubernetes; CLI `nerdctl`.
- **CRI-O**: Kubernetes-only CRI.
- **LXC/LXD**: system containers (full OS).

Install with `sys pkg`:
```bash
sys pkg install docker
sys pkg install podman
```

## Podman (rootless by default)
```bash
podman pull nginx:alpine
podman run -d -p 8080:80 nginx:alpine
podman ps
podman exec -it <c> sh
podman logs -f <c>
podman pod create --name mypod -p 8080:80
podman run -d --pod mypod nginx
```

## Docker (same flags)
```bash
docker run -d -p 8080:80 nginx:alpine
docker ps / docker logs -f <c>
docker system prune
```

## Service (use `sys svc`)
```bash
sys svc enable --now docker
sys svc status docker
```

## Security
```bash
--cap-drop=ALL --cap-add=NET_BIND_SERVICE
--security-opt seccomp=custom.json
--read-only --tmpfs /tmp
# Docker userns-remap in /etc/docker/daemon.json
```

## Building
```bash
podman build -t myapp .
podman build --no-cache .
# Multi-stage Dockerfile: FROM builder AS x ... COPY --from=x
```

## Networking & storage
```bash
podman network create mynet
podman run -d --network mynet --name web nginx
# Drivers: bridge (default), host, macvlan, none
# Storage: overlay2 (default), btrfs/zfs, vfs
```

## Troubleshooting
```bash
podman inspect <c>      # config + state
podman top <c>          # processes
podman stats            # live usage
nerdctl ps -a           # containerd
crictl ps               # CRI (kubelet)
ctr images ls
```
Rootless note: cannot bind ports < 1024 unless `sysctl net.ipv4.ip_unprivileged_port_start=80`.
