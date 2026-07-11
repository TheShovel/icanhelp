# Observability: Metrics, Logging, Tracing

## Overview
Observability is the ability to understand the internal state of a system from its external outputs. The three pillars are Metrics, Logs, and Traces.

## Metrics

### Types of Metrics
| Type | Description | Use Case |
|------|-------------|----------|
| **Counter** | Monotonically increasing | Request count, error count |
| **Gauge** | Can go up or down | Memory usage, queue size |
| **Histogram** | Distribution of values | Request latency, response size |
| **Summary** | Quantiles over sliding window | Latency percentiles |

### Prometheus Metrics Format
```text
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",handler="/api/users",status="200"} 1027

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",handler="/api/users",le="0.1"} 500
http_request_duration_seconds_bucket{method="GET",handler="/api/users",le="0.5"} 900
http_request_duration_seconds_bucket{method="GET",handler="/api/users",le="+Inf"} 1000
http_request_duration_seconds_sum{method="GET",handler="/api/users"} 150.5
http_request_duration_seconds_count{method="GET",handler="/api/users"} 1000
```

### Key Metrics to Collect (RED Method)
```text
Rate:   Requests per second
Errors: Failed requests per second
Duration: Request latency (p50, p95, p99)
```

### USE Method (For Resources)
```text
Utilization: % of capacity used
Saturation:  Work queued / waiting
Errors:      Error count
```

### PromQL Queries
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Latency percentile (histogram)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Top endpoints by latency
topk(10, histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) by (handler))

# Service health
up{job="my-service"} == 1
```

### Instrumentation (Go Example)
```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    requestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "handler", "status"},
    )
    
    requestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request latency",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "handler"},
    )
)

func handler(w http.ResponseWriter, r *http.Request) {
    timer := prometheus.NewTimer(requestDuration.WithLabelValues(r.Method, r.URL.Path))
    defer timer.ObserveDuration()
    
    // ... handle request
    
    requestsTotal.WithLabelValues(r.Method, r.URL.Path, "200").Inc()
}
```

## Logging

### Structured Logging (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "user-service",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "User created",
  "fields": {
    "user_id": "12345",
    "email": "user@example.com",
    "duration_ms": 45
  }
}
```

### Log Levels
| Level | Use Case |
|-------|----------|
| **DEBUG** | Detailed diagnostic info |
| **INFO** | General operational events |
| **WARN** | Potential issues, degraded performance |
| **ERROR** | Failed operations, data loss |
| **FATAL** | Application crash imminent |

### Best Practices
```go
// Use structured logging
logger.Info("User created",
    "user_id", user.ID,
    "email", user.Email,
    "duration_ms", duration.Milliseconds(),
)

// Include correlation IDs
ctx := context.WithValue(context.Background(), "trace_id", traceID)
logger := logger.With("trace_id", traceID)

// Avoid logging sensitive data
logger.Info("Login attempt",
    "username", username,
    "ip", clientIP,
    // NOT password!
)

// Log errors with context
logger.Error("Failed to create user",
    "error", err,
    "user_id", userID,
    "attempt", attempt,
)
```

### Log Aggregation
```yaml
# Fluent Bit config
[SERVICE]
    Flush        5
    Log_Level    info
    Daemon       off
    Parsers_File parsers.conf

[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Parser            docker
    Tag               kube.*
    Refresh_Interval  5

[FILTER]
    Name                kubernetes
    Match               kube.*
    Kube_URL            https://kubernetes.default.svc:443
    Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
    Kube_Tag_Prefix     kube.var.log.containers.
    Merge_Log           On
    Merge_Log_Key       log_processed
    K8S-Logging.Parser  On
    K8S-Logging.Exclude On

[OUTPUT]
    Name            loki
    Match           *
    Url             http://loki:3100/loki/api/v1/push
    TenantID        ""
    Labels          {job="fluentbit"}
    LabelKeys       namespace,pod,container
    BatchWait       1
    BatchSize       10240
    LineFormat      json
    LogLevel        info
```

## Distributed Tracing

### Trace Context Propagation (W3C Trace Context)
```text
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate:  vendor=value
```

### Span Structure
```json
{
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "parentSpanId": "a1b2c3d4e5f6",
  "name": "GET /api/users",
  "kind": "SERVER",
  "startTime": "2024-01-15T10:30:45.123Z",
  "endTime": "2024-01-15T10:30:45.168Z",
  "duration": 45000000,
  "attributes": {
    "http.method": "GET",
    "http.url": "https://api.example.com/api/users",
    "http.status_code": 200,
    "http.route": "/api/users",
    "net.peer.ip": "10.0.0.1"
  },
  "events": [
    {
      "time": "2024-01-15T10:30:45.130Z",
      "name": "db.query",
      "attributes": {
        "db.statement": "SELECT * FROM users",
        "db.duration_ms": 15
      }
    }
  ],
  "status": { "code": "OK" }
}
```

### OpenTelemetry Instrumentation (Go)
```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

func initTracer() (*trace.TracerProvider, error) {
    exporter, err := otlptracegrpc.New(context.Background())
    if err != nil {
        return nil, err
    }
    
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("user-service"),
            semconv.ServiceVersion("1.0.0"),
        )),
    )
    
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))
    
    return tp, nil
}

// In handler
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))
    
    tracer := otel.Tracer("user-service")
    ctx, span := tracer.Start(ctx, "GET /api/users",
        trace.WithAttributes(
            attribute.String("http.method", r.Method),
            attribute.String("http.route", r.URL.Path),
        ),
    )
    defer span.End()
    
    // Add attributes
    span.SetAttributes(attribute.Int("user.count", len(users)))
    
    // Add events
    span.AddEvent("db.query.start", trace.WithAttributes(
        attribute.String("db.statement", "SELECT * FROM users"),
    ))
    
    // ... handle request
    
    span.SetAttributes(attribute.Int("http.status_code", 200))
}
```

### HTTP Middleware for Tracing
```go
func tracingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))
        
        tracer := otel.Tracer("http-server")
        ctx, span := tracer.Start(ctx, r.Method+" "+r.URL.Path,
            trace.WithAttributes(
                semconv.HTTPMethodKey.String(r.Method),
                semconv.HTTPTargetKey.String(r.URL.Path),
                semconv.NetHostPortKey.String(r.Host),
            ),
        )
        defer span.End()
        
        // Wrap response writer to capture status code
        ww := &responseWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(ww, r.WithContext(ctx))
        
        span.SetAttributes(semconv.HTTPStatusCodeKey.Int(ww.statusCode))
        if ww.statusCode >= 400 {
            span.SetStatus(codes.Error, http.StatusText(ww.statusCode))
        }
    })
}
```

## Alerting

### Alert Rules (Prometheus)
```yaml
groups:
- name: service-alerts
  rules:
  # High error rate
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
      /
      sum(rate(http_requests_total[5m])) by (service)
      > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate on {{ $labels.service }}"
      description: "Error rate is {{ $value | humanizePercentage }}"

  # High latency
  - alert: HighLatency
    expr: |
      histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
      > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency on {{ $labels.service }}"
      description: "P95 latency is {{ $value }}s"

  # Service down
  - alert: ServiceDown
    expr: up{job="my-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"

  # High memory usage
  - alert: HighMemoryUsage
    expr: |
      (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage on {{ $labels.container }}"
```

### Alertmanager Config
```yaml
route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'pagerduty'
    continue: true
  - match:
      severity: warning
    receiver: 'slack'

receivers:
- name: 'default'
  email_configs:
  - to: 'team@example.com'
    send_resolved: true

- name: 'pagerduty'
  pagerduty_configs:
  - service_key: '<key>'
    severity: critical

- name: 'slack'
  slack_configs:
  - api_url: '<webhook>'
    channel: '#alerts'
    send_resolved: true
    title: '{{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'
```

## Dashboards (Grafana)

### Key Panels
```json
{
  "title": "Service Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (service)",
          "legendFormat": "{{service}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)",
          "legendFormat": "{{service}}"
        }
      ]
    },
    {
      "title": "Latency (P50, P95, P99)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
          "legendFormat": "{{service}} p50"
        },
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
          "legendFormat": "{{service}} p95"
        },
        {
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
          "legendFormat": "{{service}} p99"
        }
      ]
    },
    {
      "title": "Active Connections",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(active_connections) by (service)",
          "legendFormat": "{{service}}"
        }
      ]
    }
  ]
}
```

## Tools Ecosystem

| Category | Tools |
|----------|-------|
| **Metrics** | Prometheus, VictoriaMetrics, Thanos, Cortex, M3DB |
| **Logging** | Loki, Elasticsearch, OpenSearch, Fluent Bit, Vector |
| **Tracing** | Jaeger, Zipkin, Tempo, X-Ray, Cloud Trace |
| **Visualization** | Grafana, Kibana, Datadog, New Relic |
| **Collection** | OpenTelemetry Collector, Fluent Bit, Vector, Telegraf |
| **Alerting** | Alertmanager, Grafana Alerting, PagerDuty, Opsgenie |

## Resources
- [OpenTelemetry](https://opentelemetry.io/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Labs Blog](https://grafana.com/blog/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Cindy Sridharan on Observability](https://copyconstruct.medium.com/)