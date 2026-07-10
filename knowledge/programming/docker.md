# Docker & Containers

## Basic Commands
```
docker ps                     — running containers
docker ps -a                  — all containers
docker images                 — list images
docker pull <image>           — download image
docker run <image>            — run container
docker run -d <image>         — detached mode
docker run -it <image> bash   — interactive shell
docker run --rm <image>       — auto-remove on exit
docker run --name mycont <image> — assign name
docker run -p 8080:80 <image> — port mapping (host:container)
docker run -v /host:/container:ro — mount volume (ro=readonly)
docker run -e VAR=value <image> — environment variable
docker stop <container>       — graceful stop
docker kill <container>       — force stop
docker rm <container>         — remove container
docker rmi <image>            — remove image
docker exec -it <container> bash — run command in running container
docker logs <container>       — show logs
docker logs -f <container>    — follow logs
docker inspect <container/image> — detailed metadata
docker cp <container>:/path ./ — copy from container
docker system prune -a        — clean everything unused
```

## Dockerfile
```dockerfile
FROM node:20-alpine           # base image (small)

WORKDIR /app                  # working directory

COPY package*.json ./         # copy files
RUN npm install               # build-time command

COPY . .                      # copy rest of files

EXPOSE 3000                   # document port

ENV NODE_ENV=production       # environment variable

RUN addgroup -S app && adduser -S app -G app
USER app                      # drop privileges

CMD ["node", "server.js"]     # default command
```

## Docker Compose
```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app               # bind mount (dev)
      - /app/node_modules    # anonymous volume
    environment:
      - NODE_ENV=development
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret
    healthcheck:
      test: pg_isready -U postgres

volumes:
  pgdata:
```
Commands:
```
docker compose up -d          — start services
docker compose down           — stop and remove
docker compose logs -f        — follow logs
docker compose exec web bash  — exec in service
docker compose build          — rebuild images
docker compose pull           — pull new images
docker compose restart        — restart services
```

## Image Management
```
docker build -t name:tag .    — build image
docker tag old new            — tag image
docker push user/repo:tag     — push to registry
docker pull user/repo:tag     — pull from registry
docker save -o file.tar image — save to tar
docker load -i file.tar       — load from tar
docker history image          — show build layers
docker image prune            — remove dangling images
```

## Container Cleanup
```
docker stop $(docker ps -q)          — stop all
docker rm $(docker ps -aq)           — remove all containers
docker rmi $(docker images -q)       — remove all images
docker system df                     — disk usage
docker system prune -a --volumes     — full cleanup
```

## Networking
```
docker network ls                  — list networks
docker network create mynet        — create network
docker network connect mynet cont  — connect container
docker network disconnect mynet cont
docker run --network mynet img     — run on network
```
Default networks: `bridge` (default), `host` (use host networking), `none`
Container DNS: containers find each other by name on user-defined networks.

## Volumes
```
docker volume ls                — list volumes
docker volume create volname    — create volume
docker volume inspect volname   — show details
docker volume rm volname        — delete
docker run -v volname:/path img — use volume
```
Volume types:
- Named volumes: managed by Docker (`-v myvol:/data`)
- Bind mounts: host path (`-v /host/path:/container/path`)
- tmpfs mounts: in-memory (`--tmpfs /data`)
- Anonymous volumes: auto-named (`-v /data`)

## Useful Patterns
```dockerfile
# Multi-stage build
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Docker vs Podman
- Podman is daemonless, rootless by default, Docker-compatible CLI
- `alias docker=podman` works almost everywhere
- `podman-compose` for compose files
- Podman pods = Kubernetes pods concept
