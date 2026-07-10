# GraphQL & API Design

## What is GraphQL
- Query language for APIs (created by Facebook, 2015, open sourced) — client specifies EXACTLY what data it needs
- **Single endpoint** (typically /graphql) vs REST (many endpoints)
- **Strongly typed schema**: defines types, queries, mutations, subscriptions — self-documenting (introspection queries)
- Solves: over-fetching (getting too much data), under-fetching (getting too little, needing multiple REST calls for related data), and multiple round-trips

## Schema & Types
```graphql
type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  posts(authorId: ID): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

type Subscription {
  userCreated: User!
  postAdded(authorId: ID!): Post!
}

type User {
  id: ID!
  name: String!
  email: String
  posts: [Post!]!       # resolver fetches related data
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!         # resolver for relationship
  comments: [Comment!]!
}

input CreateUserInput {
  name: String!
  email: String!
  age: Int
}
```

## Queries vs Mutations
- **Queries**: read data — executed in parallel (resolvers run simultaneously)
- **Mutations**: write data — executed SEQUENTIALLY (one after another, in order)
  - Mutations can return data (the mutated object) so client doesn't need separate query
- **Subscriptions**: real-time updates over WebSocket — client subscribes, server pushes

## Resolvers
```javascript
const resolvers = {
  Query: {
    user: (parent, args, context, info) => {
      return db.users.findById(args.id)
    },
    users: (parent, args, context) => {
      return db.users.findAll({ limit: args.limit, offset: args.offset })
    }
  },
  User: {
    posts: (parent, args, context) => {
      return db.posts.findAll({ where: { authorId: parent.id } })
    }
  },
  Mutation: {
    createUser: (parent, args, context) => {
      return db.users.create(args.input)
    }
  }
}
```
- **Resolver chain**: query → root fields (query types) → nested types resolved by parent resolvers
- **N+1 problem**: fetching user → for each user, fetch posts individually = N+1 queries!
  - Solution: DataLoader (batching + caching) — batches individual keys into single query per request

## DataLoader (Solve N+1)
```javascript
const DataLoader = require('dataloader')

const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findByIds(ids)
  return ids.map(id => users.find(u => u.id === id))
})

// In resolver:
User: {
  posts: (parent, args, context) => {
    return context.loaders.postLoader.load(parent.id)
  }
}
```

## Fragments & Variables
```graphql
# Variables
query GetUser($id: ID!, $includePosts: Boolean!) {
  user(id: $id) {
    id
    name
    posts @include(if: $includePosts) {
      title
    }
  }
}

# Fragments (reusable field sets)
fragment UserFields on User {
  id
  name
  email
}

query GetUsers {
  users {
    ...UserFields
    posts { title }
  }
}

# Inline fragments (for interfaces/unions)
query Search {
  search(query: "hello") {
    ... on User { name }
    ... on Post { title }
  }
}
```

## Pagination
- **Offset-based**: `limit + offset` (same as REST) — problems: missing items if inserted/deleted, performance on large offsets (cursor-based recommended)
- **Cursor-based** (Relay spec): `first/after, last/before`
```graphql
type Query {
  users(first: Int!, after: String): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!   # opaque cursor (usually base64 encoded ID/timestamp)
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Server Implementations
- **Apollo Server** (JavaScript/TypeScript): most popular, full-featured, built-in DataLoader integration, studio/app for exploration
- **GraphQL Yoga** (JavaScript): lightweight wrapper around Apollo, good for edge runtimes
- **Relay** (client, Facebook): opinionated, batching, pagination spec — more complex, powerful for large apps
- **GraphQL.NET**, **gqlgen** (Go), **Ariadne/Strawberry** (Python), **graphql-ruby**, **Junegraph** (Rust), **Hot Chocolate** (.NET)
- **Hasura**: auto-generates GraphQL from PostgreSQL — instant CRUD + relationships + subscriptions + authorization
- **PostGraphile**: similar to Hasura — Postgres → GraphQL in one command

## Security
- **Query complexity**: nested queries can be EXPONENTIAL (user → posts → comments → author → posts → ...!) — set max depth (5-7), query cost analysis based on field complexity (weighted scoring), rate limiting, timeout
  - This user's malicious query: `{ posts { author { posts { author { posts { ... }}}}}` — depth limit solves
- **Batching attacks**: sending many queries in one request → DDoS — set max query cost, throttle by API key/IP
- **Authentication**: JWT in Authorization header, validate in context before each resolver runs
- **Authorization**: field-level + type-level — Apollo `@auth` directive, custom middleware
  - Example: only return email if caller is the user or admin
- **Persisted queries**: allow only known/whitelisted queries, reject arbitrary — prevents new attack vectors
  - Apollo persisted queries + automatic persisted queries (APQ): send only query hash (64 char) instead of full query, reduces request size. For first request: send hash + full query, server caches. Subsequent: hash only = network savings

## Federation & Microservices
- **Federation** (Apollo): compose multiple GraphQL services into single endpoint — each service owns its domain/types
  - Each service defines its own schema + resolvers. Gateway composes them. `@key` directive marks shared entities across services
  - Example: `User` type in both Users service AND Reviews service (via `@key(fields: "id")`)
  - Built by Apollo as alternative to schema stitching (older approach, had more limitations — type conflicts between services)
- **Schema stitching**: older technique — merge multiple schemas manually (can be fragile with name conflicts)
- **GraphQL Mesh**: treat ANY data source (REST, SOAP, gRPC, databases) as GraphQL — auto-generate schema from OpenAPI/Swagger

## GraphQL vs REST
- **GraphQL good for**: complex data relationships, multiple clients with different needs, rapidly evolving frontends, real-time (subscriptions), mobile (minimize data transfer), when you want self-documentation with built-in explorer (GraphiQL, Apollo Studio)
  - Best at: dashboards, mobile apps, social feeds, chat applications, any app with many different views/reducers
- **REST good for**: simple CRUD, caching (HTTP caching works natively — GraphQL is single endpoint, caching more complex), file uploads (native multipart), when you want mature tooling, simple APIs, when GraphQL overhead isn't justified
  - Best at: public APIs (GitHub, Stripe both have REST + GraphQL), microservices (simple — true REST APIs can be modeled in GraphQL), high-traffic trivial lookups
- **GraphQL weaknesses**: caching harder (need Apollo Cache Control, CDN-friendly, persisted queries), performance monitoring more involved (Apollo Studio, tracing), over-engineering for simple APIs (don't use GraphQL just because it's trendy), file uploads less standard (multipart request spec, alternative approaches)
