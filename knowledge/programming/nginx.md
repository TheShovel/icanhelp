# Nginx Web Server & Reverse Proxy

## Installation
```
# Debian/Ubuntu
apt install nginx

# Fedora/RHEL
dnf install nginx

# From source with modules
./configure --prefix=/etc/nginx --with-http_ssl_module --with-http_v2_module
make && make install

# Test config syntax
nginx -t
```

## Basic Configuration Structure
```
/etc/nginx/
├── nginx.conf          # Main config
├── sites-available/    # Virtual host configs (linked to sites-enabled)
├── sites-enabled/      # Active vhosts
├── conf.d/             # Global included snippets
└── modules-enabled/    # Dynamic modules
```

## Server Block (Virtual Host)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;  # Force HTTPS
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/example.com;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Reverse Proxy
```nginx
# Pass traffic to backend (Node, Python, Java, etc.)
location /app/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';  # WebSocket support
    proxy_cache_bypass $http_upgrade;

    # Buffering
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 30s;
}
```

## Load Balancing
```nginx
upstream backend {
    # Least connections strategy
    least_conn;

    # IP hash for session persistence
    # ip_hash;

    server 10.0.0.1:8080 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:8080 weight=2;
    server 10.0.0.3:8080 backup;  # Only used when others down
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

## Static File Serving
```nginx
# Cache static assets aggressively
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?|svg)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
    log_not_found off;

    # gzip on-the-fly
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
}

# Prevent access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}
```

## Rate Limiting
```nginx
# Define zone (10MB store, 30 req/min per IP)
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=30r/m;

server {
    location /login/ {
        limit_req zone=mylimit burst=5 nodelay;
        limit_req_status 429;
        proxy_pass http://backend;
    }
}
```

## Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "0" always;  # Deprecated, use CSP
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;
add_header Strict-Transport-Security "max-age=63072000" always;
```

## Common Operations
```
# Reload config gracefully (no downtime)
nginx -s reload

# Stop immediately
nginx -s stop

# Graceful shutdown (finish open connections)
nginx -s quit

# Reopen log files (after log rotation)
nginx -s reopen

# Reload systemd-managed
systemctl reload nginx

# Check status
systemctl status nginx
```

## Logging
```nginx
# Custom log format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" $request_time $upstream_response_time';

access_log /var/log/nginx/access.log main;
error_log  /var/log/nginx/error.log warn;

# Disable access log for health checks
location /health {
    access_log off;
    return 200 "OK";
}
```

## Troubleshooting
- `nginx -t` — test config before reload
- `journalctl -u nginx` — systemd logs
- Check `/var/log/nginx/error.log` for upstream failures
- `curl -I https://example.com` — inspect response headers
- `ss -tlnp | grep nginx` — verify listening sockets
- Common 502: upstream backend is down or firewall blocks it
- Common 499: client closed connection (timeout or cancel)
- Common 413: `client_max_body_size` limit (default 1MB)
- ssl_certificate must include full chain (leaf + intermediates)
