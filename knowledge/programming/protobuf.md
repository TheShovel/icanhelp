# Protocol Buffers (protobuf)

## Overview
Protocol Buffers (protobuf) is Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data. Think JSON, but smaller, faster, and with schema evolution.

## Key Benefits
| Aspect | Protobuf | JSON |
|--------|----------|------|
| Size | 3-10x smaller | Baseline |
| Speed | 20-100x faster parsing | Baseline |
| Schema | Required (`.proto` files) | Optional |
| Evolution | Built-in (field numbers) | Manual |
| Languages | 12+ official | All |

## Syntax (proto3)

### Basic Message
```protobuf
// user.proto
syntax = "proto3";

package user.v1;

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  int32 age = 4;
  bool active = 5;
  repeated string tags = 6;
  map<string, string> metadata = 7;
  enum Status {
    STATUS_UNSPECIFIED = 0;
    STATUS_ACTIVE = 1;
    STATUS_INACTIVE = 2;
    STATUS_PENDING = 3;
  }
  Status status = 8;
  google.protobuf.Timestamp created_at = 9;
  google.protobuf.Duration ttl = 10;
}
```

### Field Rules
```protobuf
message Example {
  // singular (proto3 default) - optional, default value if not set
  string name = 1;
  
  // repeated - array/list
  repeated string tags = 2;
  
  // map - key-value
  map<string, int32> scores = 3;
  
  // oneof - union (only one field set)
  oneof identifier {
    string email = 4;
    string phone = 5;
    string user_id = 6;
  }
  
  // reserved - prevent reuse of deleted field numbers/names
  reserved 7, 9 to 15;
  reserved "old_field", "deprecated_name";
}
```

### Scalar Types
| .proto Type | C++ | Java | Python | Go | Notes |
|-------------|-----|------|--------|-----|-------|
| double | double | double | float | float64 | |
| float | float | float | float | float32 | |
| int32 | int32 | int | int | int32 | Variable-length (zigzag for negative) |
| int64 | int64 | long | int | int64 | |
| uint32 | uint32 | int | int | uint32 | |
| uint64 | uint64 | long | int | uint64 | |
| sint32 | int32 | int | int | int32 | Zigzag encoding (efficient for negative) |
| sint64 | int64 | long | int | int64 | Zigzag encoding |
| fixed32 | uint32 | int | int | uint32 | Always 4 bytes |
| fixed64 | uint64 | long | int | uint64 | Always 8 bytes |
| sfixed32 | int32 | int | int | int32 | Always 4 bytes |
| sfixed64 | int64 | long | int | int64 | Always 8 bytes |
| bool | bool | boolean | bool | bool | |
| string | string | String | str/unicode | string | UTF-8 |
| bytes | string | ByteString | bytes | []byte | Arbitrary binary |

### Well-Known Types (google.protobuf)
```protobuf
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/any.proto";
import "google/protobuf/wrappers.proto";
import "google/protobuf/struct.proto";
import "google/protobuf/field_mask.proto";
import "google/protobuf/empty.proto";

message Event {
  google.protobuf.Timestamp occurred_at = 1;
  google.protobuf.Duration duration = 2;
  google.protobuf.Any payload = 3;           // Any message type
  google.protobuf.StringValue nullable_str = 4; // Nullable string
  google.protobuf.Struct dynamic_data = 5;   // JSON-like
  google.protobuf.FieldMask update_mask = 6; // For partial updates
}
```

### Enums
```protobuf
enum Priority {
  // First value MUST be 0 (default)
  PRIORITY_UNSPECIFIED = 0;
  PRIORITY_LOW = 1;
  PRIORITY_MEDIUM = 2;
  PRIORITY_HIGH = 3;
  PRIORITY_CRITICAL = 4;
  
  // Allow aliases (same number, different names)
  PRIORITY_URGENT = 4; // Same as CRITICAL
  
  // Reserve numbers/names for future
  reserved 100 to 199;
  reserved "OLD_PRIORITY";
}
```

### Nested Messages
```protobuf
message Order {
  string id = 1;
  User customer = 2;  // Nested message type
  repeated OrderItem items = 3;
  
  message OrderItem {
    string product_id = 1;
    int32 quantity = 2;
    Money price = 3;
  }
}

message Money {
  int64 amount_cents = 1;
  string currency = 2; // ISO 4217
}
```

### Imports
```protobuf
// Public import - transitively available
import public "google/protobuf/timestamp.proto";

// Weak import - optional, may not exist
import weak "optional_feature.proto";
```

## Schema Evolution Rules

### ✅ Safe Changes
```protobuf
// 1. Add new fields (with new tag numbers)
message User {
  string name = 1;
  string email = 2;
  string phone = 3;  // NEW - OK
}

// 2. Remove fields (mark reserved)
message User {
  string name = 1;
  // string email = 2;  // REMOVED
  reserved 2;          // Prevent reuse
  reserved "email";
}

// 3. Rename fields (keep tag number)
message User {
  string full_name = 1;  // Was 'name'
}

// 4. Add values to enum (not 0)
enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_ACTIVE = 1;
  STATUS_NEW = 2;  // NEW - OK
}

// 5. Change field default (not wire format)
// 6. Change syntax from proto2 to proto3
```

### ❌ Breaking Changes
```protobuf
// 1. Reuse tag numbers
message User {
  string name = 1;
  // string email = 1;  // CONFLICT!
}

// 2. Change field type (different wire format)
message User {
  int32 age = 1;        // Was string!
  // int64 age = 1;      // Also breaking (varint vs fixed)
}

// 3. Change singular ↔ repeated
message User {
  // string name = 1;
  repeated string name = 1;  // BREAKING
}

// 4. Move field in/out of oneof
// 5. Change namespace/package
```

## gRPC Integration

### Service Definition
```protobuf
// user_service.proto
syntax = "proto3";

package user.v1;

import "google/protobuf/empty.proto";
import "google/protobuf/field_mask.proto";

service UserService {
  // Unary RPC
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty);
  
  // Server streaming
  rpc ListUsers(ListUsersRequest) returns (stream User);
  
  // Client streaming
  rpc BatchCreateUsers(stream CreateUserRequest) returns (BatchCreateUsersResponse);
  
  // Bidirectional streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  User user = 1;
}

message UpdateUserRequest {
  User user = 1;
  google.protobuf.FieldMask update_mask = 2;
}

message DeleteUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  string filter = 3;
}

message BatchCreateUsersResponse {
  repeated User users = 1;
}

message ChatMessage {
  string user_id = 1;
  string text = 2;
  google.protobuf.Timestamp sent_at = 3;
}
```

### HTTP/JSON Mapping (grpc-gateway)
```protobuf
// Annotations for REST
import "google/api/annotations.proto";
import "google/api/http.proto";

service UserService {
  rpc GetUser(GetUserRequest) returns (User) {
    option (google.api.http) = {
      get: "/v1/users/{id}"
    };
  }
  
  rpc CreateUser(CreateUserRequest) returns (User) {
    option (google.api.http) = {
      post: "/v1/users"
      body: "user"
    };
  }
  
  rpc UpdateUser(UpdateUserRequest) returns (User) {
    option (google.api.http) = {
      patch: "/v1/users/{user.id}"
      body: "user"
    };
  }
  
  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = {
      delete: "/v1/users/{id}"
    };
  }
  
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse) {
    option (google.api.http) = {
      get: "/v1/users"
    };
  }
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
}
```

## Language-Specific Usage

### Go
```go
// Generate: protoc --go_out=. --go-grpc_out=. user.proto

import (
    "context"
    "google.golang.org/grpc"
    "google.golang.org/protobuf/types/known/timestamppb"
    userv1 "github.com/example/user/v1"
)

func createUser(client userv1.UserServiceClient) {
    user := &userv1.User{
        Id:        "123",
        Email:     "user@example.com",
        Name:      "John Doe",
        Age:       30,
        Active:    true,
        Tags:      []string{"premium", "beta"},
        Status:    userv1.Status_STATUS_ACTIVE,
        CreatedAt: timestamppb.Now(),
    }
    
    resp, err := client.CreateUser(context.Background(), &userv1.CreateUserRequest{
        User: user,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Created: %v\n", resp)
}

// Server streaming
func listUsers(client userv1.UserServiceClient) {
    stream, err := client.ListUsers(context.Background(), &userv1.ListUsersRequest{
        PageSize: 10,
    })
    if err != nil {
        log.Fatal(err)
    }
    
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatal(err)
        }
        fmt.Println(user.Name)
    }
}
```

### Python
```python
# Generate: python -m grpc_tools.protoc --proto_path=. --python_out=. --grpc_python_out=. user.proto

import grpc
import user_pb2
import user_pb2_grpc
from google.protobuf import timestamp_pb2

def create_user(stub):
    user = user_pb2.User(
        id="123",
        email="user@example.com",
        name="John Doe",
        age=30,
        active=True,
        tags=["premium", "beta"],
        status=user_pb2.Status.STATUS_ACTIVE,
        created_at=timestamp_pb2.Timestamp().GetCurrentTime()
    )
    
    response = stub.CreateUser(user_pb2.CreateUserRequest(user=user))
    print(f"Created: {response}")

# Async (Python 3.7+)
async def async_create_user(stub):
    response = await stub.CreateUser(user_pb2.CreateUserRequest(user=user))
```

### TypeScript/JavaScript
```typescript
// Generate: protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts --ts_out=. user.proto

import { UserServiceClient } from './user_grpc_web_pb';
import { User, CreateUserRequest, Status } from './user_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

const client = new UserServiceClient('https://api.example.com');

const user = new User();
user.setId('123');
user.setEmail('user@example.com');
user.setName('John Doe');
user.setAge(30);
user.setActive(true);
user.setTagsList(['premium', 'beta']);
user.setStatus(Status.STATUS_ACTIVE);
user.setCreatedAt(Timestamp.fromDate(new Date()));

const request = new CreateUserRequest();
request.setUser(user);

client.createUser(request, {}, (err, response) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Created:', response.toObject());
});
```

### Java/Kotlin
```java
// Generate: protoc --java_out=. --grpc-java_out=. user.proto

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import user.v1.UserServiceGrpc;
import user.v1.User;
import user.v1.CreateUserRequest;
import com.google.protobuf.Timestamp;

public class UserClient {
    public static void main(String[] args) {
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress("localhost", 9090)
            .usePlaintext()
            .build();
        
        UserServiceGrpc.UserServiceBlockingStub stub = 
            UserServiceGrpc.newBlockingStub(channel);
        
        User user = User.newBuilder()
            .setId("123")
            .setEmail("user@example.com")
            .setName("John Doe")
            .setAge(30)
            .setActive(true)
            .addTags("premium")
            .addTags("beta")
            .setStatus(User.Status.STATUS_ACTIVE)
            .setCreatedAt(Timestamp.newBuilder().setSeconds(Instant.now().getEpochSecond()))
            .build();
        
        User response = stub.createUser(CreateUserRequest.newBuilder().setUser(user).build());
        System.out.println("Created: " + response.getName());
        
        channel.shutdown();
    }
}
```

## Advanced Patterns

### Oneof for Polymorphism
```protobuf
message Event {
  string id = 1;
  google.protobuf.Timestamp timestamp = 2;
  
  oneof payload {
    UserCreated user_created = 10;
    UserUpdated user_updated = 11;
    UserDeleted user_deleted = 12;
    OrderPlaced order_placed = 20;
    PaymentReceived payment_received = 21;
  }
}

// Usage
if (event.hasUserCreated()) {
    handleUserCreated(event.getUserCreated());
} else if (event.hasOrderPlaced()) {
    handleOrderPlaced(event.getOrderPlaced());
}
```

### Any for Type-Erased Messages
```protobuf
import "google/protobuf/any.proto";

message Notification {
  string user_id = 1;
  google.protobuf.Any payload = 2;  // Can be any message type
}

// Packing
Any any = Any.newBuilder()
    .setTypeUrl("type.googleapis.com/user.v1.UserCreated")
    .setValue(userCreated.toByteString())
    .build();

// Unpacking
if (any.is(UserCreated.class)) {
    UserCreated uc = any.unpack(UserCreated.class);
}
```

### FieldMask for Partial Updates
```protobuf
// Request
message UpdateUserRequest {
  User user = 1;
  google.protobuf.FieldMask update_mask = 2;
}

// Usage (only update name and email)
FieldMask mask = FieldMask.newBuilder()
    .addPaths("name")
    .addPaths("email")
    .build();

// Server applies only masked fields
```

## Performance Tips

### Encoding Optimization
```protobuf
// Use appropriate types
// For small integers (0-100): uint32 (varint)
// For timestamps: int64 (millis) or Timestamp
// For enum flags: use bits in int32 instead of repeated enum

// Avoid:
repeated string tags = 1;  // Each string has overhead

// Better:
repeated int32 tag_ids = 1;  // Reference lookup table

// For large binary data: use bytes, consider separate blob storage
```

### Message Size Limits
```protobuf
// gRPC default: 4MB
// Configure larger if needed:
options {
  grpc.max_receive_message_length = 100 * 1024 * 1024;  // 100MB
  grpc.max_send_message_length = 100 * 1024 * 1024;
}
```

## Tools

| Tool | Purpose |
|------|---------|
| `protoc` | Compiler |
| `buf` | Modern protobuf toolchain (lint, breaking, generate) |
| `protoc-gen-validate` | Generate validation code |
| `prototool` | Legacy toolchain |
| `grpcurl` | CLI for gRPC (like curl) |
| `bloomrpc` / `postman` | GUI gRPC clients |
| `protobuf-inspector` | Decode without .proto |

## buf.yaml (Modern Config)
```yaml
version: v1
name: buf.build/acme/user
deps:
  - buf.build/googleapis/googleapis
  - buf.build/bufbuild/protovalidate

build:
  roots:
    - proto

lint:
  use:
    - DEFAULT
  except:
    - PACKAGE_VERSION_SUFFIX
  ignore:
    - proto/legacy

breaking:
  use:
    - FILE
  ignore:
    - proto/experimental
```

## Resources
- [Protocol Buffers Docs](https://protobuf.dev/)
- [gRPC Docs](https://grpc.io/docs/)
- [buf.build](https://buf.build/) - Schema registry
- [protobuf-es](https://github.com/bufbuild/protobuf-es) - TypeScript/JS
- [connectrpc.com](https://connectrpc.com/) - Modern RPC alternative