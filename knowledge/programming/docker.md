# Docker Practical Guide

## Images

### Build
```dockerfile
# Multi-stage build (smaller final image)
# Stage 1: Build
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o myapp .

# Stage 2: Runtime
FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/myapp .
USER 1000:1000
EXPOSE 8080
ENTRYPOINT ["./myapp"]
```

### Build Commands
```bash
docker build -t myapp:latest .
docker build -t myapp:v1.2.3 --build-arg VERSION=v1.2.3 .
docker build --target builder -t myapp:debug .  # Stop at builder stage

# BuildKit features (default in Docker 23+)
DOCKER_BUILDKIT=1 docker build --cache-from=type=registry,ref=myapp:cache .
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```

### Image Management
```bash
docker images                   # List images
docker images --filter "dangling=true"  # Unused layers
docker image prune -a           # Remove unused
docker rmi image:tag            # Remove specific
docker image inspect image:tag  # Details
docker history image:tag        # Layer history
docker save image:tag > image.tar
docker load < image.tar
```

### .dockerignore
```gitignore
# Exclude from build context
.git
.gitignore
Dockerfile
docker-compose.yml
*.log
node_modules
vendor
__pycache__
*.pyc
.env
*.tar.gz
```

## Containers

### Run
```bash
# Basic
docker run -d --name myapp -p 8080:8080 myapp:latest

# With options
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 8080:8080 \
  -e ENV=production \
  -e DATABASE_URL=postgres://user:pass@db:5432/db \
  -v /host/data:/app/data \
  -v myapp-config:/app/config \
  --memory=512m --cpus=1 \
  --health-cmd="wget -qO- http://localhost:8080/health" \
  --health-interval=30s --health-timeout=5s --health-retries=3 \
  myapp:latest

# Interactive
docker run -it --rm ubuntu:22.04 bash
docker exec -it myapp bash
```

### Resource Limits
```bash
# Memory
--memory=512m              # Hard limit
--memory-swap=1g           # Swap limit (memory + swap)
--memory-swappiness=0      # Disable swap
--oom-kill-disable         # Don't kill on OOM (risky)

# CPU
--cpus=1.5                 # 1.5 CPU cores
--cpu-shares=1024          # Relative weight (default 1024)
--cpuset-cpus="0,1"        # Specific cores

# I/O
--device-read-bps=/dev/sda:1mb
--device-write-bps=/dev/sda:1mb
--device-read-iops=/dev/sda:1000
```

### Volume Management
```bash
# Named volumes (persistent, managed by Docker)
docker volume create mydata
docker run -v mydata:/data myapp

# Bind mounts (host path)
docker run -v /host/path:/container/path myapp
docker run -v /host/path:/container/path:ro myapp  # Read-only

# tmpfs (memory, non-persistent)
docker run --tmpfs /app/cache:size=100m myapp

# Volume drivers
docker volume create --driver local \
  -o type=nfs -o device=:/remote/path -o o=addr=192.168.1.100,rw \
  nfs-volume
```

### Networking
```bash
# Networks
docker network create mynet
docker network ls
docker network inspect mynet
docker network connect mynet container
docker network disconnect mynet container

# Run with network
docker run --network mynet --name app myapp

# Host network (no isolation, Linux only)
docker run --network host myapp

# None (no networking)
docker run --network none myapp

# Publish ports
-p 8080:80          # Host:Container
-p 127.0.0.1:8080:80  # Bind to localhost only
-P                  # Publish all exposed ports randomly
```

## Docker Compose

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: myapp:${VERSION:-latest}
    container_name: myapp
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env.production
    volumes:
      - app-data:/app/data
      - ./config:/app/config:ro
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:16-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass "${REDIS_PASSWORD}"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  app-data:
  db-data:
  redis-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt

networks:
  default:
    name: myapp-network
```

### Compose Commands
```bash
docker compose up -d              # Start
docker compose up -d --build      # Rebuild and start
docker compose down               # Stop and remove
docker compose down -v            # Also remove volumes
docker compose ps                 # List containers
docker compose logs -f            # Follow logs
docker compose logs -f app        # Service logs
docker compose exec app bash      # Exec into service
docker compose run --rm app migrate  # One-off command
docker compose config             # Validate and render
docker compose pull               # Pull images
docker compose build --no-cache   # Force rebuild
```

### Override Files
```bash
# Multiple compose files
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Override specific service
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Dockerfile Best Practices

### Layer Caching
```dockerfile
# Bad: copies all, invalidates cache on any file change
COPY . .
RUN npm install

# Good: copy package files first, install, then copy source
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

### Security
```dockerfile
# Non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup
USER appuser

# Read-only root filesystem
# docker run --read-only ...

# Drop capabilities
# docker run --cap-drop=ALL --cap-add=CAP_NET_BIND_SERVICE ...

# Scan images
docker scan myapp:latest
trivy image myapp:latest
```

### Multi-Architecture
```bash
# Create builder
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Build and push multi-arch
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  --push .
```

## Registry Operations

### Login
```bash
docker login registry.example.com
docker logout registry.example.com

# Credential helper (Docker config)
{
  "credsStore": "pass"
}
```

### Tag & Push
```bash
docker tag myapp:latest registry.example.com/myapp:v1.0.0
docker push registry.example.com/myapp:v1.0.0

# Multi-tag
docker tag myapp:latest registry.example.com/myapp:latest
docker tag myapp:latest registry.example.com/myapp:v1.0.0
docker push registry.example.com/myapp --all-tags
```

### Private Registry
```bash
# Run local registry
docker run -d -p 5000:5000 --name registry \
  -v /opt/registry:/var/lib/registry \
  registry:2

# Configure insecure registry (daemon.json)
{
  "insecure-registries": ["localhost:5000", "myregistry:5000"]
}
```

## Troubleshooting

### Container Issues
```bash
# Logs
docker logs -f --tail 100 container_name
docker logs --since 1h container_name

# Inspect
docker inspect container_name
docker inspect --format '{{.State.ExitCode}}' container_name

# Resource usage
docker stats container_name
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Processes
docker top container_name
docker exec container_name ps aux

# Network
docker exec container_name netstat -tulpn
docker exec container_name ss -tulpn

# Filesystem
docker exec container_name df -h
docker exec container_name du -sh /app/*
```

### Image Issues
```bash
# Debug image
docker run --rm -it --entrypoint sh myapp:latest

# Dive into layers
dive myapp:latest

# Export filesystem
docker create --name temp myapp:latest
docker export temp | tar -tv
docker rm temp
```

### System Issues
```bash
# Disk usage
docker system df
docker system df -v

# Cleanup
docker system prune -a --volumes  # DANGEROUS: removes all unused
docker container prune
docker image prune -a
docker volume prune
docker network prune

# Daemon logs
journalctl -u docker -f
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/docker.yml
name: Docker

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Registry
        if: github.event_name != 'pull_request'
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
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Common Patterns

### Init Containers (Database Migration)
```yaml
services:
  migrate:
    image: myapp:latest
    command: ["migrate", "up"]
    depends_on:
      db:
        condition: service_healthy
    deploy:
      restart_policy:
        condition: on-failure

  app:
    depends_on:
      migrate:
        condition: service_completed_successfully
```

### Sidecar (Logging/Monitoring)
```yaml
services:
  app:
    # ... main app
    
  log-forwarder:
    image: fluent/fluent-bit:latest
    volumes:
      - ./fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
      - /var/log/containers:/var/log/containers:ro
    depends_on:
      - app
```

### Health Check Patterns
```dockerfile
# HTTP endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Database connection
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pg_isready -h localhost -U user -d db || exit 1

# Custom script
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD /app/healthcheck.sh
```

## Rootless Docker

```bash
# Install
curl -fsSL https://get.docker.com/rootless | sh

# Enable user systemd
systemctl --user enable --now docker

# Verify
docker version
docker run --rm hello-world

# Alias
alias docker='docker'
# Add to ~/.bashrc: export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
```

## Performance Tips

1. **Use .dockerignore** - Reduces build context size
2. **Multi-stage builds** - Smaller final images
3. **Layer ordering** - Cache dependencies before source
4. **Alpine/base images** - Smaller attack surface
5. **Combine RUN commands** - Fewer layers
6. **Use BuildKit** - Parallel builds, better caching
7. **Squash layers** - `docker build --squash` (experimental)
8. **Pull base images** - `docker compose pull` before build