# Containerization & Docker Deep Dive

## Docker Architecture
- **Client-server**: docker CLI sends API calls to dockerd (daemon). Daemon handles images, containers, volumes, networking. Daemon exposes REST API (on /var/run/docker.sock — multi-tenant risk: don't mount socket into containers unless needed, grants root access to host)
- **Images vs containers**: image = read-only template (layered filesystem). Container = running instance of image (writable layer on top). Image layers: each instruction in Dockerfile creates a layer (cached, reusable). Layers shared between images — saves disk (if two images both use same ubuntu:22.04 base, only one copy of that layer stored). Union filesystem (OverlayFS, AUFS, Btrfs) merges layers into single view
- **Dockerfile**: build instructions — FROM, RUN, COPY, ADD (same as COPY but can handle URLs + tar auto-extract — prefer COPY for clarity, ADD for Tar+URL). EXPOSE (documentation only — doesn't automatically publish port; runtime -p actually opens it). CMD + ENTRYPOINT. WORKDIR, ENV, USER (non-root user best practice: add user group: `RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app` then USER app)

## Dockerfile Best Practices
- **Multi-stage builds**: separate build + runtime stages. Final image only contains runtime dependencies (not compilers, build tools, test dependencies). Dramatically reduces image size
  ```dockerfile
  # Build stage
  FROM node:20 AS builder
  WORKDIR /app
  COPY . .
  RUN npm ci && npm run build

  # Runtime stage
  FROM node:20-alpine
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  CMD ["node", "dist/server.js"]
  ```
  - Distroless images (Google distroless): minimal runtime, no shell, no package manager — tiny, reduces attack surface (no /bin/sh, no curl, no apt). Debug with `docker exec`? Actually can't exec into a distroless container because no entrypoint — you use `docker run --entrypoint` with a debug container sidecar. For debugging, you can add a debug image (like -debug tag) with busybox
- **Layer ordering**: copy package.json separately from source code — dependency installation cached until package.json changes. Copy source last (frequent changes don't invalidate dependency cache). RUN apt-get update && apt-get install -y in same RUN (clean apt cache in same layer: `&& rm -rf /var/lib/apt/lists/*` to keep layer small)
  - Combine RUN commands (each RUN adds a layer). Use `.dockerignore` (exclude node_modules, .git, __pycache__, build artifacts). Keep base images small (alpine: node:20-alpine = ~120MB vs node:20 = 1.2GB) — but Alpine uses musl not glibc → some Python/Node native modules may fail to link. Use `apk add gcompat` or choose distroless
- **Security**: don't run as root (default — create user). Don't store secrets in image (use build args for non-sensitive, Docker secrets for sensitive). Scan images for vulnerabilities (docker scan, Trivy, Snyk, Grype). Keep base images updated (automate with Dependabot/Renovate for dockerfile FROM updates)

## Docker Compose
```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: pg_isready -U postgres

volumes:
  pgdata:
```
- depends_on: doesn't wait for service readiness (web may start before db is ready to accept connections). Use wait-for-it.sh or healthcheck. docker compose 2.1+ supports `depends_on` with `condition: service_healthy`

## Docker Networking
- **Bridge** (default): isolated network, port mapping ( -p 8080:80 maps host 8080 → container 80). Containers communicate via IP or links. User-defined bridge: automatic DNS resolution (service name → IP). Use this for multi-container apps (avoids --link, better isolation)
- **Host**: container shares host network (no network isolation). Performance (no NAT). Good for: services that need host-level network access, low-latency, or binding many ports
- **Overlay**: for Swarm/ multi-host networking. Encapsulated packets across nodes. Each service on overlay network can communicate across any swarm node
- **None**: no network. Loopback only. Used for batch/offline processing

## Docker Volumes
- **Named volumes**: managed by Docker (`-v myvol:/data`). Persistent, survive container removal. Cannot be accessed by non-Docker processes easily (stored on host at /var/lib/docker/volumes/...). Better for production
- **Bind mounts**: host directory mounted (`-v /host/path:/container/path`). Changes on either side reflected immediately. Good for dev (hot reload). Not portable. Security risk: container can potentially access any host directory
- **tmpfs**: in-memory, no persistence. For secrets, temporary files, configs. Fast, volatile. Linux only
- **Volume drivers**: local (default), NFS, cloud-specific (EBS, S3), Ceph, GlusterFS. For distributed storage, mount S3 bucket or NFS share. Rancher Longhorn: distributed block storage for Docker/K8s

## Docker in Production
- **Logging**: container logs to stdout/stderr (use structured JSON logs). docker logs command reads from container's stdout. Production: send to log aggregator via log drivers (json-file, journald, syslog, fluentd, awslogs, gelf, etc.). Avoid writing log files inside container (lost when container restarts)
- **Resource limits**: memory: `--memory="512m" --memory-reservation="256m" --memory-swap="1g"` (prevents single container starving host). CPU: `--cpus="1.5" — limit to 1.5 CPUs` (prevents CPU starvation). OOM killer kills container that exceeds memory (no swap): set `--memory` without `--memory-swap` = swap = memory limit but double. Fail early = OOM kills container only, not host
- **Health checks**: Dockerfile HEALTHCHECK (docker ps shows health status: starting → healthy → unhealthy). Compose supports healthcheck in service definition. Use healthcheck for load balancer integration (only route traffic to healthy containers). `curl -f http://localhost:8080/health` or `wget --spider` or CMD-specific binary
- **Orchestration**: Docker Compose (single host, dev/small prod). Docker Swarm (multi-host, built-in, simpler, less ecosystem). Kubernetes (industry standard, complex, powerful). Nomad (HashiCorp, simpler than K8s, batch + long-running services)
