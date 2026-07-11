# Microservices Architecture

## Overview

Microservices decompose an application into small, independently deployable services organized around business capabilities.

```
┌─────────────────────────────────────────────────────────────┐
                        API Gateway
└───────────────┬───────────────────┬───────────────────┬─────┘
                ▼                   ▼                   ▼
         ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
         │   User      │     │   Order     │     │  Product    │
         │  Service    │     │  Service    │     │  Service    │
         │             │     │             │     │             │
         │ - Users     │     │ - Orders    │     │ - Products  │
         │ - Auth      │     │ - Payments  │     │ - Inventory │
         └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
                │                   │                   │
                ▼                   ▼                   ▼
         ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
         │   User      │     │   Order     │     │  Product    │
         │   DB        │     │   DB        │     │  DB         │
         └─────────────┘     └─────────────┘     └─────────────┘
```

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | One service, one business capability |
| **Autonomy** | Independent deployment, scaling, failure |
| **Decentralized Data** | Each service owns its data |
| **Failure Isolation** | Failure in one doesn't cascade |
| **Evolutionary Design** | Replace/upgrade services independently |

## Service Communication

### Synchronous (Request-Response)

```python
# REST Client
import httpx

class OrderServiceClient:
    def __init__(self, base_url: str):
        self.client = httpx.AsyncClient(base_url=base_url, timeout=5.0)
    
    async def get_order(self, order_id: str) -> dict:
        response = await self.client.get(f"/orders/{order_id}")
        response.raise_for_status()
        return response.json()
    
    async def create_order(self, data: dict) -> dict:
        response = await self.client.post("/orders", json=data)
        response.raise_for_status()
        return response.json()

# gRPC
import grpc
from order_pb2 import OrderRequest
from order_pb2_grpc import OrderServiceStub

class GRPCOrderClient:
    def __init__(self, host: str, port: int):
        channel = grpc.aio.insecure_channel(f"{host}:{port}")
        self.stub = OrderServiceStub(channel)
    
    async def get_order(self, order_id: str) -> OrderResponse:
        request = OrderRequest(order_id=order_id)
        return await self.stub.GetOrder(request)
```

### Asynchronous (Event-Driven)

```python
# Event Publisher
import aio_pika
import json

class EventPublisher:
    def __init__(self, amqp_url: str):
        self.amqp_url = amqp_url
        self.connection = None
        self.channel = None
    
    async def connect(self):
        self.connection = await aio_pika.connect_robust(self.amqp_url)
        self.channel = await self.connection.channel()
        await self.channel.declare_exchange("events", aio_pika.ExchangeType.TOPIC)
    
    async def publish(self, event_type: str, payload: dict):
        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            content_type="application/json",
            headers={"event_type": event_type}
        )
        await self.channel.default_exchange.publish(
            message, routing_key=f"events.{event_type}"
        )

# Event Consumer
class EventConsumer:
    def __init__(self, amqp_url: str, queue_name: str):
        self.amqp_url = amqp_url
        self.queue_name = queue_name
    
    async def start(self, handlers: dict):
        connection = await aio_pika.connect_robust(self.amqp_url)
        channel = await connection.channel()
        exchange = await channel.declare_exchange("events", aio_pika.ExchangeType.TOPIC)
        queue = await channel.declare_queue(self.queue_name, durable=True)
        
        for event_type, handler in handlers.items():
            await queue.bind(exchange, routing_key=f"events.{event_type}")
        
        await queue.consume(self._process_message)
    
    async def _process_message(self, message: aio_pika.IncomingMessage):
        async with message.process():
            event_type = message.headers.get("event_type")
            payload = json.loads(message.body)
            # Route to handler
```

## Data Management

### Database per Service

```sql
-- User Service Database
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order Service Database  
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,  -- Reference only, no FK
    status VARCHAR(50) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID NOT NULL,  -- Reference to Product service
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
);
```

### Saga Pattern (Distributed Transactions)

```python
# Choreography-based Saga
class OrderSaga:
    def __init__(self, event_publisher: EventPublisher):
        self.publisher = event_publisher
        self.steps = [
            self._reserve_inventory,
            self._process_payment,
            self._confirm_order,
        ]
        self.compensations = [
            self._release_inventory,
            self._refund_payment,
            self._cancel_order,
        ]
    
    async def execute(self, order_data: dict):
        completed_steps = []
        try:
            for step in self.steps:
                await step(order_data)
                completed_steps.append(step)
        except Exception as e:
            # Compensate in reverse
            for compensation in reversed(self.compensations[:len(completed_steps)]):
                try:
                    await compensation(order_data)
                except Exception:
                    # Log for manual intervention
                    pass
            raise
    
    async def _reserve_inventory(self, order_data):
        await self.publisher.publish("inventory.reserve", {
            "order_id": order_data["order_id"],
            "items": order_data["items"]
        })
    
    async def _release_inventory(self, order_data):
        await self.publisher.publish("inventory.release", {
            "order_id": order_data["order_id"]
        })

# Orchestration-based Saga
class OrderOrchestrator:
    def __init__(self, inventory_client, payment_client, order_repo):
        self.inventory = inventory_client
        self.payment = payment_client
        self.orders = order_repo
    
    async def create_order(self, command: CreateOrderCommand):
        order = Order.create(command)
        
        try:
            # Step 1: Reserve inventory
            await self.inventory.reserve(order.items)
            order.reserve_inventory()
            
            # Step 2: Process payment
            payment_result = await self.payment.charge(
                order.customer_id, order.total
            )
            order.process_payment(payment_result.transaction_id)
            
            # Step 3: Confirm
            order.confirm()
            await self.orders.save(order)
            
            # Publish event
            await self.publish(OrderConfirmed(order))
            
        except InventoryUnavailable:
            order.fail("Inventory unavailable")
            await self.orders.save(order)
            raise
        except PaymentFailed as e:
            await self.inventory.release(order.items)
            order.fail("Payment failed")
            await self.orders.save(order)
            raise
```

## API Gateway

```python
# FastAPI Gateway
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx

app = FastAPI()

SERVICES = {
    "users": "http://user-service:8000",
    "orders": "http://order-service:8000",
    "products": "http://product-service:8000",
}

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def gateway(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(404, "Service not found")
    
    base_url = SERVICES[service]
    url = f"{base_url}/{path}"
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=dict(request.headers),
                params=dict(request.query_params),
                content=await request.body(),
                timeout=30.0
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.TimeoutException:
            raise HTTPException(504, "Gateway timeout")
        except httpx.RequestError:
            raise HTTPException(502, "Bad gateway")
```

## Service Discovery

```python
# Consul-based
import consul

class ServiceRegistry:
    def __init__(self, consul_host: str = "consul"):
        self.consul = consul.Consul(host=consul_host)
    
    def register(self, name: str, host: str, port: int, tags: list = None):
        self.consul.agent.service.register(
            name=name,
            service_id=f"{name}-{host}-{port}",
            address=host,
            port=port,
            tags=tags or [],
            check=consul.Check.http(f"http://{host}:{port}/health", "10s")
        )
    
    def discover(self, name: str) -> list:
        _, services = self.consul.health.service(name, passing=True)
        return [
            f"http://{s['Service']['Address']}:{s['Service']['Port']}"
            for s in services
        ]
    
    def deregister(self, service_id: str):
        self.consul.agent.service.deregister(service_id)
```

## Configuration

```python
# Centralized config with Consul/Etcd
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Service config
    service_name: str = "order-service"
    port: int = 8000
    
    # Database
    database_url: str
    
    # Messaging
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    
    # Service URLs (can be overridden by discovery)
    user_service_url: str = "http://user-service:8000"
    product_service_url: str = "http://product-service:8000"
    
    # Observability
    jaeger_host: str = "jaeger"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Resilience Patterns

### Circuit Breaker

```python
import asyncio
from enum import Enum
from dataclasses import dataclass
import time

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    recovery_timeout: int = 30
    expected_exception: type = Exception
    
    def __post_init__(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0
        self._lock = asyncio.Lock()
    
    async def call(self, func, *args, **kwargs):
        async with self._lock:
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitOpenError()
        
        try:
            result = await func(*args, **kwargs)
            async with self._lock:
                self.on_success()
            return result
        except self.expected_exception as e:
            async with self._lock:
                self.on_failure()
            raise
    
    def on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
```

### Retry with Backoff

```python
import asyncio
import random
from functools import wraps

def retry(max_attempts: int = 3, base_delay: float = 1.0, max_delay: float = 60.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt == max_attempts - 1:
                        break
                    delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                    await asyncio.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

# Usage
@retry(max_attempts=3, base_delay=1.0)
async def call_user_service(user_id: str):
    async with httpx.AsyncClient() as client:
        return await client.get(f"{settings.user_service_url}/users/{user_id}")
```

### Bulkhead

```python
import asyncio
from collections import defaultdict

class Bulkhead:
    def __init__(self, max_concurrent: int = 10):
        self.semaphores = defaultdict(lambda: asyncio.Semaphore(max_concurrent))
    
    async def execute(self, key: str, func, *args, **kwargs):
        semaphore = self.semaphores[key]
        async with semaphore:
            return await func(*args, **kwargs)

# Per-service bulkhead
user_service_bulkhead = Bulkhead(max_concurrent=20)
payment_service_bulkhead = Bulkhead(max_concurrent=5)

async def get_user(user_id: str):
    return await user_service_bulkhead.execute("user-service", 
        lambda: httpx.get(f"{settings.user_service_url}/users/{user_id}"))
```

## Observability

### Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# Setup
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor.instrument()

# Usage
tracer = trace.get_tracer(__name__)

async def create_order(order_data: dict):
    with tracer.start_as_current_span("create_order") as span:
        span.set_attribute("order.id", order_data.get("order_id"))
        
        with tracer.start_as_current_span("reserve_inventory"):
            await inventory_client.reserve(order_data["items"])
        
        with tracer.start_as_current_span("process_payment"):
            await payment_client.charge(order_data["payment"])
```

### Metrics

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Response

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active connections')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    ACTIVE_CONNECTIONS.inc()
    start_time = time.time()
    
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(time.time() - start_time)
    
    ACTIVE_CONNECTIONS.dec()
    return response

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

### Structured Logging

```python
import structlog
import logging

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage
logger.info("order_created", order_id=order.id, customer_id=order.customer_id, total=order.total)
logger.error("payment_failed", order_id=order.id, error=str(e), payment_id=payment.id)
```

## Deployment

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: myorg/order-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: order-service-secrets
              key: database-url
        - name: RABBITMQ_URL
          value: "amqp://rabbitmq:5672"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### Service Mesh (Istio)

```yaml
# VirtualService for traffic splitting
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10

# Circuit Breaker
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

## Testing Strategies

### Contract Testing (Pact)

```python
# Consumer test
import aiohttp
from pact import Consumer, Provider

pact = Consumer("OrderService").has_pact_with(Provider("UserService"), host_name="localhost", port=1234)

def test_get_user():
    expected = {"id": "123", "email": "test@example.com", "name": "Test User"}
    
    (pact
     .given("user 123 exists")
     .upon_receiving("a request for user 123")
     .with_request("GET", "/users/123")
     .will_respond_with(200, body=expected))
    
    with pact:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{pact.uri}/users/123") as resp:
                assert resp.status == 200
                data = await resp.json()
                assert data == expected
```

### Integration Testing

```python
# Testcontainers
import pytest
from testcontainers.postgres import PostgresContainer
from testcontainers.rabbitmq import RabbitMqContainer

@pytest.fixture(scope="session")
def postgres():
    with PostgresContainer("postgres:16") as pg:
        yield pg.get_connection_url()

@pytest.fixture(scope="session")
def rabbitmq():
    with RabbitMqContainer("rabbitmq:3.12") as rmq:
        yield rmq.get_connection_url()

@pytest.mark.asyncio
async def test_order_flow(postgres, rabbitmq):
    # Setup services with test containers
    order_service = OrderService(postgres, rabbitmq)
    
    # Test
    order = await order_service.create_order(...)
    assert order.status == "confirmed"
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **Distributed Monolith** | Tight coupling, synchronous calls | Async messaging, clear boundaries |
| **Shared Database** | Schema coupling, scaling issues | Database per service |
| **Chatty Services** | Latency, failure cascade | Aggregate APIs, batching |
| **Missing Observability** | Can't debug production | Tracing, metrics, logging |
| **No Contract Testing** | Breaking changes | Consumer-driven contracts |
| **Hardcoded Endpoints** | Can't move services | Service discovery |

## When to Use Microservices

✅ **Good fit:**
- Large team (50+ developers)
- Complex domain with clear boundaries
- Different scaling needs per capability
- Need for technology diversity
- Independent deployment requirements

❌ **Avoid when:**
- Small team (<10 developers)
- Simple domain
- Strong consistency requirements
- Limited DevOps maturity
- Prototype/MVP phase