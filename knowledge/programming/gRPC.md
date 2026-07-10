# gRPC

## Overview

gRPC is a high-performance RPC framework using **Protocol Buffers** (protobuf) as IDL and serialization format. Built on **HTTP/2** — multiplexed streams, bidirectional flows, header compression. Code generation produces client/server stubs in 11+ languages. Contract-first API design.

## Protocol Buffers (IDL)

Define services + message types in `.proto` files:

```protobuf
syntax = "proto3";

package users;
option go_package = "userspb/";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
  rpc UpdateUser (stream UpdateUserRequest) returns (User);
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int32 age = 4;
  repeated string tags = 5;     // array
  Address address = 6;          // nested
  map<string, string> meta = 7; // map
}

message GetUserRequest {
  string id = 1;
}
```

- Field numbers 1-15: 1 byte on wire (use for frequent fields)
- `repeated`: packed encoding by default (proto3)
- `oneof`: exactly one field set at a time
- `enum`: `enum Status { UNKNOWN = 0; ACTIVE = 1; }`
- `google.protobuf.Timestamp`, `Duration`, `Empty`, `Struct`, `Value`

## Service Types (4 Patterns)

### Unary (request ↔ response)

```protobuf
rpc GetUser(GetUserRequest) returns (User);
```

Client sends one request, server replies with one response. Most like REST/HTTP.

### Server Streaming (request → stream response)

```protobuf
rpc ListUsers(ListUsersRequest) returns (stream User);
```

Client sends one request. Server pushes multiple messages. Used for real-time feeds, logs, large result sets.

### Client Streaming (stream request → response)

```protobuf
rpc UpdateUser(stream UpdateUserRequest) returns (User);
```

Client sends a stream of messages. Server replies once after all received. Used for file uploads, batch processing.

### Bidirectional Streaming (stream ↔ stream)

```protobuf
rpc Chat(stream ChatMessage) returns (stream ChatMessage);
```

Both sides send independent streams concurrently. Order preserved per direction. Used for chat, live collaboration, game state sync.

## Code Generation

```bash
# Install
brew install protobuf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate
protoc --go_out=. --go-grpc_out=. users.proto
```

- `protoc` compiler: generate client stubs + server interfaces
- Language-specific plugins: `protoc-gen-*` for JS/TS, Python, Java, C#, Rust, etc.
- `buf` tool (Buf) is the modern alternative: workspace management, linting, breaking change detection

## Server Implementation (Go example)

```go
type userServer struct {
    userspb.UnimplementedUserServiceServer
}

func (s *userServer) GetUser(ctx context.Context, req *userspb.GetUserRequest) (*userspb.User, error) {
    return &userspb.User{Id: req.Id, Name: "Alice"}, nil
}

func (s *userServer) ListUsers(req *userspb.ListUsersRequest, stream userspb.UserService_ListUsersServer) error {
    for _, u := range users {
        stream.Send(&u)
    }
    return nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    userspb.RegisterUserServiceServer(s, &userServer{})
    s.Serve(lis)
}
```

## Client Implementation

```go
conn, _ := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
defer conn.Close()
client := userspb.NewUserServiceClient(conn)

// unary
user, _ := client.GetUser(ctx, &userspb.GetUserRequest{Id: "1"})

// server streaming
stream, _ := client.ListUsers(ctx, &userspb.ListUsersRequest{})
for {
    user, err := stream.Recv()
    if err == io.EOF { break }
}

// client streaming
stream, _ := client.UpdateUser(ctx)
stream.Send(&userspb.UpdateUserRequest{Id: "1", Age: 30})
resp, _ := stream.CloseAndRecv()

// bidi
stream, _ := client.Chat(ctx)
stream.Send(&msg1)
resp, _ := stream.Recv()
```

## Interceptors (Middleware)

Chainable middleware for client and server.

### Server Interceptor

```go
func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    log.Printf("method: %s", info.FullMethod)
    return handler(ctx, req)
}

s := grpc.NewServer(grpc.UnaryInterceptor(loggingInterceptor))
```

- `UnaryServerInterceptor`, `StreamServerInterceptor`
- Client side: `UnaryClientInterceptor`, `StreamClientInterceptor`
- `grpc_middleware.ChainUnaryInterceptors()` for stacking

## Deadlines & Timeouts

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
resp, err := client.GetUser(ctx, req)
```

- Server checks `ctx.Deadline()` and can cancel early
- if client timeout > server timeout: server returns `DeadlineExceeded`
- Default: no deadline (client can hang forever). Always set deadlines.

## Error Handling

```go
// Server
status.Errorf(codes.NotFound, "user %s not found", id)
status.Error(codes.InvalidArgument, "bad request")

// Client
st, ok := status.FromError(err)
st.Code()    // codes.NotFound, codes.InvalidArgument, codes.DeadlineExceeded, etc.
st.Message()
```

Standard gRPC status codes: `OK`, `Canceled`, `Unknown`, `InvalidArgument`, `DeadlineExceeded`, `NotFound`, `AlreadyExists`, `PermissionDenied`, `Unauthenticated`, `ResourceExhausted`, `FailedPrecondition`, `Aborted`, `OutOfRange`, `Unimplemented`, `Internal`, `Unavailable`, `DataLoss`.

### Error Details

```go
st, _ := status.New(codes.NotFound, "user missing")
ds, _ := st.WithDetails(&errdetails.ResourceInfo{ResourceType: "user", ResourceName: id})
return ds.Err()
```

## Metadata

Key-value pairs like HTTP headers. Pass context info (auth tokens, tracing IDs).

```go
// Client
md := metadata.Pairs("authorization", "Bearer token")
ctx := metadata.NewOutgoingContext(context.Background(), md)
resp, _ := client.GetUser(ctx, req)

// Server
md, ok := metadata.FromIncomingContext(ctx)
token := md.Get("authorization")
```

## Load Balancing

- **Client-side LB**: gRPC resolves DNS, opens subchannels per backend
- **Pick-first**: try address in order (default)
- **Round-robin**: `grpc.WithDefaultServiceConfig("{\"loadBalancingConfig\":[{\"round_robin\":{}}]}")`
- **gRPC-Resolver**: DNS, Kubernetes (headless service), Consul, manual
- **Proxy**: gRPC-Web requires Envoy / gRPC-web proxy for browser clients

## gRPC-Web

Browser support via proxy (Envoy, grpcweb). Converts gRPC to HTTP/1.1 + binary framing. Limitations: no bidirectional streaming (only server-streaming), no trailers.

## Performance

- Serialization: protobuf ~4-10× faster than JSON
- Payload size: ~30% of equivalent JSON
- HTTP/2 multiplexing: single TCP connection per client
- Streaming: no per-request overhead, sub-millisecond bidirectional latency
- Use `grpc-go` keepalive pings for connection health

## Security (TLS)

```go
// Server
creds, _ := credentials.NewServerTLSFromFile("cert.pem", "key.pem")
s := grpc.NewServer(grpc.Creds(creds))

// Client
creds, _ := credentials.NewClientTLSFromFile("ca.crt", "server.example.com")
conn, _ := grpc.Dial(":50051", grpc.WithTransportCredentials(creds))
```

- mTLS: mutual TLS authentication
- Interceptor-based: validate JWT/token in metadata
- `google.golang.org/grpc/credentials` and `xds` credentials

## Streaming vs REST/GraphQL

| Aspect | gRPC | REST | GraphQL |
|--------|------|------|---------|
| Protocol | HTTP/2 | HTTP/1.1+ | HTTP/1.1+ |
| Serialization | Protobuf (binary) | JSON (text) | JSON (text) |
| Contract | `.proto` required | OpenAPI optional | SDL required |
| Streaming | Native (4 types) | SSE hack / chunked | Subscriptions (WS usually) |
| Browser support | Proxy needed (gRPC-Web) | Native | Native |
| Code gen | Auto stubs | Manually or OpenAPI gen | Auto (Apollo, Relay) |
| Field selection | Server-defined | Server-defined | Client-driven |
| Strong typing | Generated types | Loose | Generated types |
| Tooling | `grpcurl`, `grpcui`, `buf` | `curl`, Postman | GraphiQL, Altair |
| Ideal for | Microservices, streaming, low-latency | CRUD, public APIs | Flexible queries, aggregation |

## Best Practices

- Use `buf` for proto linting (check field naming, package conventions, breaking changes)
- Version services: package-based (`users.v1`, `users.v2`) or `google.protobuf.Any`
- Limit message size: default 4 MB. Configure with `grpc.MaxRecvMsgSize()`.
- Use `keepalive.EnforcementPolicy` to prevent client flooding
- Graceful shutdown: `s.GracefulStop()` — drain in-flight requests
- Health checks: implement `grpc.health.v1.Health` proto for k8s probes
- Reflection: `grpc.Server{Reflection: true}` — enable `grpcurl` and `grpcui` without proto files
