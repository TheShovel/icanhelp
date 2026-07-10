# MongoDB

NoSQL document database — flexible schema, horizontal scaling, rich queries.

## Document Model
- **BSON**: Binary JSON — supports types: string, integer, double, boolean, date, ObjectId, array, embedded document, binary data, null, regex. Max document size: 16MB
- **Collections**: Group of documents — analogous to tables in SQL. Documents in same collection can have different fields (schema flexibility)
- **_id field**: Required unique primary key. Generated as ObjectId by default (12 bytes: timestamp + machine ID + process ID + counter). Can use custom unique values (UUID, integer, string)
- **Embedded documents**: Nested objects inside parent document — model one-to-one/ one-to-many relationships within single document. Avoids joins. Example: `{ user: 'joe', address: { city: 'NYC', zip: '10001' } }`
- **Arrays**: Store lists — `{ tags: ['mongodb', 'database', 'nosql'] }`. Array operations: `$push`, `$pull`, `$addToSet`, positional operator `$`

## CRUD Operations
- **Create**: `db.collection.insertOne({...})`, `insertMany([...])`, `insert` (deprecated). Returns insertedId
- **Read**: `db.collection.find({field: value})`, `findOne({...})`. Projection: `find({...}, {name: 1, _id: 0})`. Comparison operators: `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$in`, `$nin`
- **Update**: `updateOne(filter, update)`, `updateMany`, `replaceOne`. Update operators: `$set` (set field), `$unset` (remove field), `$inc` (increment), `$rename`, `$push` (add to array), `$pull` (remove from array). Upsert: `{ upsert: true }` inserts if no match
- **Delete**: `deleteOne({...})`, `deleteMany({...})`, `drop()` (entire collection). Be careful with deleteMany({}) (clears collection)

## Query Operators
- **Logical**: `$and`, `$or`, `$not`, `$nor`. Implicit AND: `{ status: 'A', qty: { $gt: 100 } }` (both conditions must match)
- **Element**: `$exists` (field exists), `$type` (BSON type check)
- **Evaluation**: `$regex` (pattern match — use with index sparingly), `$expr` (compare fields within document), `$mod` (modulo), `$text` (full-text search)
- **Array**: `$all` (match all elements), `$size` (array length), `$elemMatch` (nested array condition)
- **Geospatial**: `$geoWithin`, `$geoIntersects`, `$nearSphere` — for location queries with 2dsphere index

## Indexing
- **Single field**: `createIndex({field: 1})` (ascending +1, descending -1). Speeds up queries filtering/sorting by that field
- **Compound index**: `createIndex({a: 1, b: -1})` — order matters: queries on {a}, {a,b}, {a,b,c} use it. Not for queries on {b} alone
- **Multikey index**: Automatically on array fields — each array element gets index entry
- **Text index**: `createIndex({field: 'text'})` — supports `$text` search with tokenization, stemming, stop words. Weights for relevance scoring
- **Hashed index**: `createIndex({field: 'hashed'})` — distributes data evenly across shards (hash sharding). Range queries not supported
- **TTL index**: `createIndex({createdAt: 1}, {expireAfterSeconds: 86400})` — auto-delete documents after time. For sessions, logs, temp data
- **Geospatial**: `2dsphere` (globe — lat/lon, supports $near, $geoWithin), `2d` (flat plane — legacy)
- **Covered queries**: All fields returned from index (no document scan). Check with `.explain('executionStats')`. `totalDocsExamined = 0` = covered
- **Index considerations**: Every index slows writes (update all indexes). Too many indexes = write bottleneck. Monitor with `db.collection.stats()`, check index usage with `$indexStats`

## Aggregation Pipeline
- **Stages processed sequentially**: `db.collection.aggregate([{$match: ...}, {$group: ...}, {$sort: ...}, {$project: ...}])`
- `$match`: Filter documents — early stage reduces pipeline data (use index)
- `$group`: Group by expression — `{ _id: '$category', total: { $sum: 1 }, avgPrice: { $avg: '$price' } }`. Accumulators: `$sum`, `$avg`, `$first`, `$last`, `$max`, `$min`, `$push` (array)
- `$project`: Reshape documents — 1/0 include/exclude fields, add computed fields
- `$sort`: Sort order — use index if possible, otherwise in-memory sorting (100MB limit, use allowDiskUse)
- `$lookup`: Left outer join (similar to SQL JOIN) — `from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders'`. Can be slow — avoid if possible (embed or denormalize)
- `$unwind`: Deconstruct array — one document per array element. Usually after $lookup or on embedded arrays
- `$addFields` / `$set`: Add new fields to documents (not in original collection)
- `$facet`: Multiple pipelines in one stage — for paginated multi-faceted searches

## Replication (Replica Set)
- **Primary node**: Accepts writes. Operations logged in oplog (capped collection). Failover triggers election
- **Secondary nodes**: Replicate primary's oplog asynchronously. Can serve reads (readPreference: secondary). Can be hidden, delayed (for recovery), or priority 0 (never primary)
- **Arbiter**: No data — only votes in elections. For odd number voting in 2-node replica set. Minimal resource
- **Election**: Triggered by primary failure. Majority of nodes must vote for new primary. Raft-like consensus. Typically <5 seconds
- **Write concern**: `{w: 'majority'}` (ack from majority), `{w: 1}` (primary only, default), `{w: 0}` (fire and forget). Higher = safer but slower writes
- **Read concern**: `local` (no guarantee propagated), `available` (sharded), `majority` (committed by majority), `linearizable` (most strict — reads after all preceding writes)

## Sharding
- **Shard key**: Field(s) MongoDB uses to distribute documents across shards. Choose cardinality high, distribution even, query pattern friendly. Bad: boolean field (2 values). Good: hashed_id or compound {region, date}
- **Shard key strategies**: Ranged (based on key range — e.g., dates 2024-Q1, 2024-Q2 — can cause hotspotting). Hashed (even distribution — for monotonically increasing values like ObjectId)
- **Components**: mongos (router — app connects here), config servers (metadata), shards (data). Auto-balancing across shards
- **Limitations**: No $lookup across shards (unless sharded on same key), no unique index without shard key, no multi-document transactions across shards (pre-4.2)
