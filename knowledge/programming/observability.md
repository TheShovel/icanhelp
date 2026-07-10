# Observability: Logging, Metrics & Tracing

## Logging Best Practices

### Structured Logging
```json
{"level":"info","msg":"user login","user_id":"abc123","ip":"192.168.1.1","ts":"2024-01-15T10:30:00Z"}
```
- Always include: timestamp, level, message, context IDs
- Use JSON for machines, human-readable for terminals
- Log levels: DEBUG < INFO < WARN < ERROR < FATAL
- Never log PII (passwords, SSN, credit cards) — mask or omit
- Use correlation ID (trace ID) across all services for request tracking

### Log Management
- **Centralized logging**: all logs to one system (Elasticsearch, Loki, CloudWatch, Datadog)
  - ELK stack: Elasticsearch (store+search), Logstash (ingest/transform), Kibana (visualize). Alternatives: Loki (Grafana), Splunk, Datadog
  - Filebeat/Fluentd: ship logs from each server to central store
- **Retention**: hot storage (7-30 days), warm (30-90 days), cold archive (>90 days, cheap S3/Glacier)
  - Compliance requirements: SOC2 (7 years for some logs), PCI (1 year), HIPAA (6 years)
- **Sampling**: for high-volume logs, sample 1:10 or 1:100 to reduce cost
  - Tail-based sampling: keep traces with errors, drop successful ones

## Metrics (Prometheus)
- **Metric types**: Counter (only increases — requests, errors). Gauge (up/down — CPU, memory, queue depth). Histogram (distribution of values — request latency). Summary (quantiles like p50, p95, p99)
- **RED method** (for each service): Rate (requests/sec). Errors (failed requests/sec). Duration (latency percentiles)
- **USE method** (for each resource): Utilization (% busy). Saturation (queue length, overload). Errors (failure count)
- **Good metrics to track**: request rate, error rate, latency (p50/p95/p99), CPU/memory/disk, queue depth, database connections, goroutine/thread count, GC pauses
  - p99 = the 99th percentile (worst 1% of requests). Track this for user experience (most users have good experience) while p50 monitors typical performance
- **Grafana**: visualize Prometheus metrics. Common panels: time series, stat, gauge, bar chart, heatmap. Annotations (deploy markers on graph). Alerts via Grafana or Alertmanager

## Distributed Tracing (Jaeger, Zipkin)
- **Trace**: end-to-end request across services. Each trace = single request flow (span tree). Trace ID propagates across service calls via HTTP headers (x-request-id, x-b3-traceid)
- **Span**: single unit of work (DB query, HTTP call, function). Has: operation name, start time, duration, tags, logs, span context (trace+span ID)
  - Child span: one service calling another. Root span: entry point (API gateway, frontend). Span tags: key-value annotations for context (http.method, status_code, db.statement)
- **Instrumentation**: OpenTelemetry (industry standard — vendor-neutral API/SDK, traces+metrics+logs). Auto-instrumentation (libraries for popular frameworks). Manual instrumentation for custom business logic
  - Sampling: sample at head (probabilistic before trace starts) or tail (sample complete traces based on criteria, like error presence). Head-based: simple, sample 5-10% of all requests. Tail-based: accurate, but need buffer for all traces before sampling decision
- **W3C Trace Context**: standard HTTP headers (traceparent, tracestate) for trace propagation across services

## Alerting & On-Call
- **Alert types**: page (immediate, wake up, firefighter — critical SLO breach, P0/P1). Ticket (next business day, P2). Dashboard (monitor only, no action needed, P3)
  - P0: service down, data loss, security incident. P1: major feature broken, p99 degradation over some threshold. P2: minor issue, needs fix this sprint. P3: cosmetic, low priority
- **Runbook**: documented procedure for handling each alert (step-by-step, commands, dashboards, escalation. Should be executable by any team member + new hire)
- **On-call best practices**: follow-the-sun (global team handoff). Primary + secondary (backup before escalation to team/manager). Maximum 12-hour shifts (burnout from overnight/sleep disruption). Blameless postmortems for incidents (root cause + prevent recurrence)
- **SLO burn rate**: alert when error budget is burning faster than expected (e.g., 5% error budget consumed in 1 hour = alert). Fast burn rate = page. Slow burn rate = ticket for next day

## Incident Response
- **Declare**: acknowledge issue, create incident channel (Slack/Discord), assign roles (Incident Commander, Scribe, Comms Lead)
- **Triage**: determine severity (P0 = major outage with active customer impact), preserve evidence (logs, metrics, DB snapshots, core dumps)
- **Mitigate**: stop the bleeding (rollback, feature flag, restart, scale up, failover). Fix comes after stabilization
- **Communicate**: status page (internal + external). Regular updates (every 30 min for P0). Transparent about impact + ETA. Appoint single point of contact for external comms (PR, legal, customer support)
- **Resolve**: monitor post-mitigation for 15-30 min, confirm all systems recovering. Close incident when service healthy, not when root cause found
- **Postmortem**: held within 48-72 hours (while fresh). Blameless: focus on systems/processes not people. Timeline: what happened + when. Root cause: why (5 whys?). Action items to prevent recurrence (with owners + deadlines)
  - Good postmortem: results in improved monitoring, automated remediation, pagerduty changes, code review/CI updates, and runbook additions. Bad postmortem: blame someone, no concrete action items

## Observability Platform (Grafana Stack)
- **Grafana**: dashboards + alerting (unified view). Loki: log aggregation (like Prometheus but for logs). Tempo: distributed tracing. Mimir: scalable Prometheus-compatible metrics
  - Grafana Cloud: hosted, free tier available (10k metrics, 50GB logs, 50GB traces). Self-host: Grafana + Mimir + Loki + Tempo on Kubernetes
- **Datadog**: all-in-one SaaS (metrics, logs, traces, APM, RUM, security). Expensive but comprehensive ($15-23/host/month + ingest costs). Best for: teams that want single pane of glass + don't mind cost
- **New Relic**: SaaS APM (application performance monitoring). Code-level insights (slowest queries, transaction traces, errors). Good for custom application performance debugging. Also expensive ($0.30/hr/host + per GB ingested)
- **Honeycomb**: high-cardinality observability. Designed for modern microservices, supports wide events (100+ columns per event). Excellent for debugging complex distributed systems. Query by any dimension instantly
