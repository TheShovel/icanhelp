# Nginx Configuration & Performance

## Installation

```bash
# Ubuntu/Debian
apt install nginx

# Mainline (newer features)
apt install nginx-mainline

# From source (custom modules)
./configure --with-http_v2_module --with-http_ssl_module \
  --with-http_realip_module --with-http_gzip_static_module \
  --with-http_stub_status_module --with-threads \
  --with-stream --with-stream_ssl_module
make && make install
```

## Main Config (nginx.conf)

```nginx
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;

error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    access_log /var/log/nginx/access.log main buffer=64k flush=5s;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;

    # Buffers
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    client_max_body_size 20m;
    large_client_header_buffers 4 8k;

    # Timeouts
    client_body_timeout 12s;
    client_header_timeout 12s;
    send_timeout 10s;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               application/vnd.ms-fontobject application/x-font-ttf
               font/opentype image/svg+xml image/x-icon;

    # Cache
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Upstream
    upstream backend {
        least_conn;
        server 10.0.0.1:8000 max_fails=3 fail_timeout=30s;
        server 10.0.0.2:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

## Virtual Hosts

### HTTP to HTTPS Redirect

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### HTTPS Config

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # SSL
    ssl_certificate /etc/nginx/certs/example.com.pem;
    ssl_certificate_key /etc/nginx/certs/example.com.key;
    ssl_trusted_certificate /etc/nginx/certs/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "geolocation=(), microphone=()";

    # Root
    root /var/www/example.com;
    index index.html;

    # Gzip static files
    gzip_static on;

    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media
    location /media/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffers
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny hidden files
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

## Reverse Proxy

```nginx
upstream app_backend {
    least_conn;
    server 10.0.0.1:8000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:8000 weight=2 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:8000 weight=1 max_fails=3 fail_timeout=30s backup;
    keepalive 64;
}

server {
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

## Load Balancing

```nginx
upstream backend {
    # Algorithms
    # round_robin (default)
    # least_conn
    # ip_hash
    # least_time (commercial)
    # random
    least_conn;

    server 10.0.0.1:8000 weight=3;
    server 10.0.0.2:8000 weight=2;
    server 10.0.0.3:8000;

    # Health checks (commercial)
    # health_check interval=10s fails=3 passes=2 uri=/health;

    keepalive 32;
}
```

## Caching

```nginx
http {
    # Cache zone
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=mycache:100m max_size=10g inactive=60m use_temp_path=off;

    # FastCGI cache
    fastcgi_cache_path /var/cache/nginx/fastcgi levels=1:2 keys_zone=fcgicache:100m max_size=10g inactive=60m;
}

server {
    location /api/ {
        proxy_cache mycache;
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_key "$scheme$request_method$host$request_uri$request_body";
        add_header X-Cache $upstream_cache_status;
        
        # Cache control
        proxy_cache_bypass $http_authorization;
        proxy_no_cache $http_authorization;
    }

    # FastCGI (PHP)
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_cache fcgicache;
        fastcgi_cache_valid 200 10m;
        fastcgi_cache_key "$scheme$request_method$host$request_uri";
        add_header X-Cache $upstream_cache_status;
        
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Cache purge
    location ~ /purge(/.*) {
        allow 127.0.0.1;
        deny all;
        proxy_cache_purge mycache "$scheme$request_method$host$1";
    }
}
```

## Rate Limiting

```nginx
http {
    # Limit zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Key by API key
    limit_req_zone $http_x_api_key zone=apikey:10m rate=100r/s;
}

server {
    # Global limit
    limit_req zone=api burst=20 nodelay;
    limit_conn conn 100;

    location /login {
        limit_req zone=login burst=5 nodelay;
        limit_req_status 429;
    }

    location /api/ {
        limit_req zone=apikey burst=50 nodelay;
    }
}
```

## Security

### WAF (ModSecurity)

```nginx
# Install: apt install libnginx-mod-http-modsecurity

http {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;
}

server {
    location / {
        modsecurity on;
        modsecurity_rules_file /etc/nginx/modsec/rules.conf;
    }
}
```

### Basic Auth

```nginx
location /admin/ {
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

### IP Allow/Deny

```nginx
location /admin/ {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
}
```

### Request Filtering

```nginx
# Block user agents
if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
    return 403;
}

# Block referrer spam
if ($http_referer ~* (bad-site1|bad-site2)) {
    return 403;
}

# Limit request body
client_max_body_size 20m;

# Block SQL injection patterns
location ~* (\.sql|\.bak|\.bak~|\.swp|\.git) {
    deny all;
}
```

## Compression

```nginx
http {
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/xhtml+xml
        application/atom+xml
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-font-opentype
        application/x-font-truetype
        font/opentype
        font/ttf
        font/woff
        font/woff2
        image/svg+xml
        image/x-icon;
}

# Brotli (requires ngx_brotli module)
brotli on;
brotli_comp_level 6;
brotli_min_length 1000;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## SSL/TLS Optimization

```nginx
# SSL session cache (shared between workers)
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;  # Forward secrecy

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# DH params (generate: openssl dhparam -out dhparam.pem 2048)
ssl_dhparam /etc/nginx/certs/dhparam.pem;

# TLS 1.3 only (modern)
ssl_protocols TLSv1.3;
ssl_ciphers TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256;
```

## Monitoring

```nginx
# Stub status
location /nginx_status {
    stub_status on;
    allow 127.0.0.1;
    deny all;
}

# Prometheus exporter
# Run: nginx-prometheus-exporter -nginx.scrape-uri=http://localhost/nginx_status

# Access log with timing
log_format timed '$remote_addr - $remote_user [$time_local] '
                 '"$request" $status $body_bytes_sent '
                 '"$http_referer" "$http_user_agent" '
                 'rt=$request_time uct="$upstream_connect_time" '
                 'uht="$upstream_header_time" urt="$upstream_response_time" '
                 'cs=$upstream_cache_status';
```

## Troubleshooting

```bash
# Test config
nginx -t

# Test config with specific file
nginx -t -c /etc/nginx/nginx.conf

# Reload
nginx -s reload

# Reopen logs
nginx -s reopen

# Stop
nginx -s stop

# Check version
nginx -V

# Debug log
error_log /var/log/nginx/error.log debug;

# Check running processes
ps aux | grep nginx

# Check connections
ss -tuln | grep :80
ss -tuln | grep :443

# Worker processes
cat /proc/$(cat /run/nginx.pid)/status | grep Threads
```

## Performance Tuning Checklist

- [ ] `worker_processes auto;`
- [ ] `worker_connections 4096;` (or higher)
- [ ] `worker_rlimit_nofile 65535;`
- [ ] `use epoll;` (Linux)
- [ ] `multi_accept on;`
- [ ] `sendfile on;`
- [ ] `tcp_nopush on;`
- [ ] `tcp_nodelay on;`
- [ ] `keepalive_timeout 65;`
- [ ] `keepalive_requests 1000;`
- [ ] `gzip on;` with appropriate types
- [ ] `gzip_static on;` for pre-compressed files
- [ ] `open_file_cache` configured
- [ ] `proxy_buffering` tuned for upstream
- [ ] `proxy_cache` for repeated requests
- [ ] `limit_req` / `limit_conn` for protection
- [ ] `ssl_session_cache` shared
- [ ] `ssl_session_tickets off;`
- [ ] `ssl_stapling on;`
- [ ] HTTP/2 enabled
- [ ] Access log buffered
- [ ] Error log at warn level

## Common Issues

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Check upstream, increase proxy timeouts |
| 504 Gateway Timeout | Increase `proxy_read_timeout`, check app performance |
| 413 Request Entity Too Large | Increase `client_max_body_size` |
| 400 Bad Request (header) | Increase `large_client_header_buffers` |
| High memory | Reduce `worker_connections`, buffer sizes |
| SSL handshake slow | Enable session cache, OCSP stapling |
| Too many open files | Increase `worker_rlimit_nofile`, system ulimit |
| Cache not working | Check `proxy_cache_key`, `proxy_cache_valid`, headers |

## Load Testing

```bash
# wrk
wrk -t4 -c100 -d30s http://example.com/

# siege
siege -c 100 -t 30s http://example.com/

# vegeta
echo "GET http://example.com/" | vegeta attack -rate=100 -duration=30s | vegeta report

# hey
hey -n 10000 -c 100 http://example.com/
```