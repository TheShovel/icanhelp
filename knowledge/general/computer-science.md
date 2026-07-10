# Computer Science Fundamentals

## Data Structures

### Arrays
- Contiguous memory, O(1) random access, O(n) insert/delete
- Dynamic arrays: amortized O(1) append (doubling strategy)
- Cache-friendly (sequential memory)

### Linked Lists
- Singly: each node points to next; doubly: prev and next pointers
- O(1) insert/delete at known position, O(n) search/access
- Used for: queues, stacks, hash tables (chaining)

### Stack (LIFO)
- `push`, `pop`, `peek` — all O(1)
- Used for: function calls, undo, expression evaluation, DFS

### Queue (FIFO)
- `enqueue`, `dequeue` — O(1) (using circular buffer or linked list)
- Used for: BFS, request queues, task scheduling

### Hash Table
- Average O(1) lookup/insert/delete
- Collision resolution: chaining (linked list in bucket), open addressing (linear/quadratic probing, double hashing)
- Load factor = n/buckets; resize when > 0.75
- Good hash: deterministic, uniform, fast

### Binary Tree / BST
- BST property: left < node < right
- Search: O(log n) average, O(n) worst (unbalanced)
- Traversals: inorder (sorted), preorder, postorder, level-order
- Self-balancing: AVL (strict), Red-Black (relaxed, used in most stdlibs)

### Heap (Priority Queue)
- Min-heap: parent < children; Max-heap: parent > children
- `insert`: O(log n), `extract_min`: O(log n), `peek`: O(1)
- Used for: Dijkstra, A*, scheduling, median tracking

### Graph
- Representation: adjacency list (most common), adjacency matrix
- DFS: stack/recursive; BFS: queue
- Dijkstra: shortest paths (non-negative weights), O(E log V)
- Bellman-Ford: handles negative weights, O(VE)
- A*: Dijkstra + heuristic for pathfinding
- Topological sort: DAG only (Kahn's algorithm or DFS)

## Algorithmic Complexity (Big O)
- **O(1)** — constant: array access, hash lookup
- **O(log n)** — logarithmic: binary search, balanced BST
- **O(n)** — linear: array search, linked list traversal
- **O(n log n)** — linearithmic: mergesort, heapsort, divide+conquer
- **O(n²)** — quadratic: bubble sort, nested loops
- **O(2ⁿ)** — exponential: recursive Fibonacci (naive)
- **O(n!)** — factorial: traveling salesman (brute force)

## Sorting
- **QuickSort**: O(n log n) avg, O(n²) worst; in-place; pivot selection matters
- **MergeSort**: O(n log n) guaranteed; stable; O(n) extra space
- **HeapSort**: O(n log n); in-place; not stable; uses heap
- **Insertion Sort**: O(n²); fast on nearly-sorted data; used as fallback in hybrid sorts
- **TimSort**: hybrid merge+insertion; Python/Java default sort; O(n) on already sorted
- **Counting/Radix/Bucket Sort**: O(n+k) for integer data with limited range

## Design Patterns
- **Singleton**: single instance, global access point (use sparingly, makes testing hard)
- **Factory**: create objects without specifying exact class
- **Observer**: one-to-many dependency (publish/subscribe)
- **Strategy**: interchangeable algorithms (composition over inheritance)
- **Decorator**: wrap object to add behavior dynamically
- **Adapter**: convert interface to expected one
- **Command**: encapsulate request as object (undo/redo, queue)
- **Dependency Injection**: pass dependencies in, don't create them inside

## System Design Concepts
- **Load balancing**: distribute requests across servers (round-robin, least-connections, IP hash)
- **Caching**: store frequently accessed data (Redis, memcached, CDN)
- **CDN**: serve static content from edge locations
- **Database sharding**: split data across databases by key (user_id, geo, hash)
- **Database replication**: primary-secondary (reads scale, writes bottleneck), primary-primary (both read/write)
- **CAP theorem**: Consistency, Availability, Partition tolerance — pick 2
- **Consistent hashing**: minimize remapping when nodes added/removed
- **Message queue**: async decoupling (Kafka, RabbitMQ, SQS)
- **Rate limiting**: token bucket, leaky bucket, sliding window
- **Idempotency key**: retry-safe operations

## Networking Basics
- **TCP**: connection-oriented, ordered, guaranteed delivery (3-way handshake: SYN, SYN-ACK, ACK)
- **UDP**: connectionless, no guarantee, low latency (DNS, video streaming, VoIP)
- **DNS**: domain → IP (A record IPv4, AAAA IPv6, CNAME alias, MX mail)
- **HTTP/1.1**: text-based, one request per connection (pipelining optional, rarely used)
- **HTTP/2**: binary, multiplexed, header compression, server push
- **HTTP/3**: QUIC (UDP-based), 0-RTT, no head-of-line blocking
- **WebSocket**: full-duplex persistent connection over TCP
- **TLS/SSL**: encryption layer; 1.2 (still common), 1.3 (recommended, faster handshake)
- **gRPC**: HTTP/2 + Protobuf, bi-directional streaming
- **OSI model**: Physical → Data Link → Network → Transport → Session → Presentation → Application
