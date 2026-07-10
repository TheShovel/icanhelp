# Apache Kafka

Distributed event streaming platform for high-throughput data pipelines and real-time applications.

## Core Concepts
- **Event (record/message)**: Key + value + timestamp + optional headers. Can be any format (Avro, JSON, Protobuf, plain text). Immutable once written
- **Topic**: Category/feed name for events. Partitioned for parallelism. Retained for configurable time (default 7 days) or size — not deleted after consumption
- **Partition**: Ordered, immutable sequence of events. Events within partition have offset (integer ID, monotonically increasing). Partitions provide parallelism (max consumers = partitions)
- **Broker**: Kafka server. Cluster = multiple brokers for fault tolerance. Bootstrap servers = initial connection point. Each partition replicated across brokers (replication factor)
- **Producer**: Publishes events to topic. Can choose partition key (hash → partition) or round-robin. Configurable durability: acks=0 (fire+forget), 1 (leader), all (all replicas)
- **Consumer**: Reads events from topic. Part of consumer group. Each partition assigned to one consumer in group. Rebalance: partition reassigned when consumer joins/leaves group
- **Consumer group**: Horizontal scaling — multiple consumers coordinate to read partitions. If more consumers than partitions, some idle. Offset committed to __consumer_offsets topic
- **Offset**: Position in partition. Auto-committed (default 5 sec) or manual. Earliest (start from oldest), latest (new messages only), or specific offset
- **ZooKeeper (legacy)**: Managed cluster metadata, leader election, controller election. KRaft (Kafka Raft) replaces ZK in Kafka 2.8+, production-ready in 3.x+. No ZK dependency

## Reliability
- **Replication factor**: 3 recommended for production. Min in-sync replicas (min.insync.replicas=2). If fewer than min ISR available, producer with acks=all gets error
- **Leader election**: Controller detects broker failure, elects new leader for affected partitions from in-sync replicas. Unclean leader election (allow non-ISR replica to become leader) = data loss
- **Exactly-once semantics (EOS)**: idempotent producer (enable.idempotence=true), transactional writes, consumer transactional reads. Idempotent: no duplicates from retries. Transactional: atomic writes across partitions
- **Retention**: Time-based (log.retention.hours=168 — 7 days), size-based (log.retention.bytes=-1 — unlimited). Compacted topics keep latest value per key (useful for table-like data)

## Performance
- **Sequential I/O**: Writes to disk sequentially — much faster than random I/O. Pages cached in OS page cache. Throughput > 2GB/s on modern hardware
- **Zero-copy**: Consumers read directly from page cache to network socket (no copy to application memory). sendfile() system call
- **Batching**: Producers batch messages (linger.ms, batch.size). Consumers fetch in batches (fetch.min.bytes, fetch.max.wait.ms). Larger batches = higher throughput, higher latency
- **Partition count**: More partitions = more parallelism but more overhead (metadata, file handles). Rule of thumb: 10x desired consumer count. Max ~4000 partitions/cluster
- **Compression**: gzip, snappy, lz4, zstd — compress at producer, decompress at consumer. Reduces network + storage. CPU trade-off. zstd best ratio, snappy best speed

## Kafka Connect
- **Source connectors**: Import from external systems — Debezium (CDC from databases), JDBC, S3 Source, MQTT. Run in distributed or standalone mode
- **Sink connectors**: Export to external systems — S3 Sink, Elasticsearch Sink, JDBC Sink, HDFS Sink. Transform data with Single Message Transforms (SMTs)
- **Integration**: Plugin architecture — prebuilt connectors for 200+ systems (Confluent Hub). Workers run connector tasks in parallel

## Kafka Streams
- **Stream processing library**: Lightweight, embeddable (no separate processing cluster). Stateful processing with RocksDB-backed state stores. Exactly-once semantics
- **Key operations**: map, filter, groupBy, aggregate, join (stream-stream, stream-table, table-table), windowing (tumbling, hopping, sliding, session)
- **DSL**: High-level — KStream (record stream), KTable (changelog, upsert), GlobalKTable (replicated to all instances). Processor API: low-level — for custom processing
- **State stores**: RocksDB (default, disk-backed), in-memory. Interactive queries query state stores directly (REST-like)

## Schema Registry
- **Avro schema**: Register schema with Registry — producer includes schema ID, consumer fetches schema by ID. Enforces compatibility: BACKWARD, FORWARD, FULL, NONE
- **Protocol buffers**: Supported (Protobuf schemas in Registry). JSON Schema also supported
- **Benefits**: Schema evolution (add/remove fields with defaults), data contract between services, prevents incompatible changes

## Monitoring
- **Metrics**: Throughput (bytes in/out per topic), request rate, request time (p99), consumer lag (critical — how far behind consumers are), partition count, under-replicated partitions, offline partitions, GC time
- **Tools**: Confluent Control Center (paid), Burrow (consumer lag), CMAK/Yahoo Kafka Manager, Prometheus + JMX exporter, Grafana dashboards, cruise-control (auto-rebalance)
- **Critical alerts**: Any under-replicated partition, consumer lag > threshold, broker down, ISR shrinks below replication factor
