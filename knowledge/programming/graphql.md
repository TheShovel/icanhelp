# GraphQL

## Overview
GraphQL is a query language for APIs and a runtime for fulfilling those queries with existing data. It provides a complete description of the data in your API, gives clients the power to ask for exactly what they need, and makes it easier to evolve APIs over time.

## Core Concepts

### Schema Definition Language (SDL)
```graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter, pagination: Pagination): UserConnection!
  posts(authorId: ID): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
  deleteUser(id: ID!): Boolean!
  createPost(input: CreatePostInput!): Post!
}

type Subscription {
  userCreated: User!
  postPublished: Post!
}

type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  profile: Profile
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  published: Boolean!
  tags: [Tag!]!
  createdAt: DateTime!
}

type Profile {
  bio: String
  avatar: String
  website: String
}

input UserFilter {
  name: String
  email: String
  createdAfter: DateTime
}

input Pagination {
  first: Int
  after: String
  last: Int
  before: String
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

scalar DateTime
scalar ID
```

### Queries
```graphql
# Basic query
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      title
    }
  }
}

# With variables
{
  "id": "123"
}

# Nested queries with fragments
query GetUserWithPosts($id: ID!) {
  user(id: $id) {
    ...UserFields
    posts {
      ...PostFields
    }
  }
}

fragment UserFields on User {
  id
  name
  email
  createdAt
}

fragment PostFields on Post {
  id
  title
  content
  published
}

# Aliases
query GetUsers {
  admin: user(id: "1") { name }
  regular: user(id: "2") { name }
}

# Directives
query GetUser($id: ID!, $includePosts: Boolean!) {
  user(id: $id) {
    name
    posts @include(if: $includePosts) {
      title
    }
  }
}
```

### Mutations
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
  }
}

mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}

# With variables
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123"
  }
}
```

### Subscriptions
```graphql
subscription OnUserCreated {
  userCreated {
    id
    name
    email
  }
}

subscription OnPostPublished($authorId: ID!) {
  postPublished(authorId: $authorId) {
    id
    title
    content
  }
}
```

## Type System

### Scalar Types
```graphql
# Built-in
Int      # Signed 32-bit integer
Float    # Signed double-precision float
String   # UTF-8 character sequence
Boolean  # true or false
ID       # Unique identifier (serialized as String)

# Custom scalars
scalar DateTime
scalar Email
scalar URL
scalar JSON
scalar BigInt
```

### Object Types
```graphql
type User implements Node {
  id: ID!
  name: String!
  email: String! @deprecated(reason: "Use emailAddress")
  emailAddress: String!
  age: Int
  posts(limit: Int = 10): [Post!]!
  profile: Profile
}

interface Node {
  id: ID!
}

union SearchResult = User | Post | Comment

enum Role {
  ADMIN
  MODERATOR
  USER
  GUEST
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  role: Role = USER
}
```

### Field Arguments
```graphql
type Query {
  # Required argument
  user(id: ID!): User
  
  # Optional with default
  users(limit: Int = 20, offset: Int = 0): [User!]!
  
  # Complex input
  search(query: String!, filters: SearchFilters): [SearchResult!]!
}

input SearchFilters {
  type: [SearchType!]
  dateRange: DateRange
  author: ID
}

input DateRange {
  start: DateTime
  end: DateTime
}
```

## Resolvers

### Basic Resolver
```javascript
const resolvers = {
  Query: {
    user: async (parent, args, context, info) => {
      return await context.db.user.findUnique({ where: { id: args.id } });
    },
    users: async (parent, args, context) => {
      return await context.db.user.findMany({
        take: args.limit,
        skip: args.offset,
        where: args.filter,
      });
    },
  },
  
  User: {
    posts: async (user, args, context) => {
      return await context.db.post.findMany({
        where: { authorId: user.id },
        take: args.limit,
      });
    },
    profile: async (user, args, context) => {
      return await context.db.profile.findUnique({ where: { userId: user.id } });
    },
    fullName: (user) => `${user.firstName} ${user.lastName}`,
  },
  
  Mutation: {
    createUser: async (parent, { input }, context) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      return await context.db.user.create({
        data: { ...input, password: hashedPassword },
      });
    },
  },
  
  Subscription: {
    userCreated: {
      subscribe: (parent, args, context) => context.pubsub.asyncIterator('USER_CREATED'),
    },
  },
};
```

### DataLoader (Batching)
```javascript
const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (ids) => {
  const users = await db.user.findMany({ where: { id: { in: ids } } });
  const userMap = new Map(users.map(u => [u.id, u]));
  return ids.map(id => userMap.get(id));
});

const resolvers = {
  User: {
    posts: (user) => postLoader.load(user.id),
  },
  Post: {
    author: (post) => userLoader.load(post.authorId),
  },
};
```

## Apollo Server

### Setup
```javascript
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);
```

### With Express
```javascript
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
  '/graphql',
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
  })
);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
```

### Context & Authentication
```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    const user = await getUserFromToken(token);
    return { user, db: prisma, pubsub };
  },
});

// In resolvers
const resolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      return context.user;
    },
  },
};
```

## Federation (Apollo Federation)

### Subgraph Schema
```graphql
# Users subgraph
extend type User @key(fields: "id") {
  id: ID! @external
  name: String! @external
}

type Query {
  userById(id: ID!): User @provides(fields: "name")
}

# Posts subgraph
extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post!]!
}

type Post @key(fields: "id") {
  id: ID!
  title: String!
  author: User!
}
```

### Gateway
```javascript
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001/graphql' },
    { name: 'posts', url: 'http://localhost:4002/graphql' },
  ],
  buildService({ name, url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        request.http.headers.set('authorization', context.token);
      },
    });
  },
});

const server = new ApolloServer({ gateway });
```

## Client Libraries

### Apollo Client (React)
```javascript
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

// Query hook
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      posts { title }
    }
  }
`;

function UserProfile({ userId }) {
  const { data, loading, error } = useQuery(GET_USER, { variables: { id: userId } });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data.user.name}</div>;
}

// Mutation
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) { id name }
  }
`;

function CreateUserForm() {
  const [createUser, { loading }] = useMutation(CREATE_USER);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createUser({ variables: { input: { name: 'John', email: 'john@test.com' } } });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### urql (Lightweight)
```javascript
import { createClient, useQuery, useMutation } from 'urql';

const client = createClient({ url: 'http://localhost:4000/graphql' });

const UserQuery = `
  query($id: ID!) {
    user(id: $id) { id name email }
  }
`;

function User({ id }) {
  const [result] = useQuery({ query: UserQuery, variables: { id } });
  const { data, fetching, error } = result;
  // ...
}
```

### Relay (Facebook)
```javascript
// Requires GraphQL schema with Node interface
// Uses compiled queries for performance
```

## Best Practices

### Schema Design
1. **Use descriptive names**: `User`, `createUser`, `UserConnection`
2. **Version through deprecation**: `@deprecated(reason: "Use emailAddress")`
3. **Nullability**: Be explicit, prefer non-null by default
4. **Pagination**: Use Relay-style connections
5. **Error handling**: Use union types for mutations

```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]!
}

type UserError {
  field: String!
  message: String!
}

mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    user { id name }
    errors { field message }
  }
}
```

### Performance
1. **DataLoader**: Batch and cache database requests
2. **Query complexity**: Limit depth and cost
3. **Caching**: Use Apollo Cache or Redis
4. **Persisted queries**: Send hash instead of full query
5. **Batch HTTP requests**: Use `@apollo/client/link/batch-http`

```javascript
// Query complexity analysis
const { depthLimit, createComplexityRule } = require('graphql-validation-complexity');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10),
    createComplexityRule({ maximumComplexity: 1000 }),
  ],
});
```

### Security
1. **Rate limiting**: Per-client or per-IP
2. **Query depth limiting**: Prevent deeply nested queries
3. **Cost analysis**: Assign costs to fields
4. **Disable introspection** in production
5. **Authentication/Authorization** in context

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    {
      async requestDidStart() {
        return {
          async didResolveOperation({ request }) {
            // Log query complexity
          },
        };
      },
    },
  ],
});
```

## Testing

### Unit Tests
```javascript
const { gql } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');
const { ApolloServer } = require('apollo-server');

const server = new ApolloServer({ typeDefs, resolvers });
const { query, mutate } = createTestClient(server);

test('fetch user', async () => {
  const GET_USER = gql`query($id: ID!) { user(id: $id) { id name } }`;
  const res = await query({ query: GET_USER, variables: { id: '1' } });
  expect(res.data.user.name).toBe('John');
});
```

### Integration Tests
```javascript
// Test with real database
const { GraphQLClient } = require('graphql-request');

const client = new GraphQLClient('http://localhost:4000/graphql', {
  headers: { authorization: 'Bearer test-token' },
});

test('create user', async () => {
  const mutation = gql`mutation($input: CreateUserInput!) { createUser(input: $input) { id } }`;
  const data = await client.request(mutation, { input: { name: 'Test', email: 'test@test.com' } });
  expect(data.createUser.id).toBeDefined();
});
```

## Tools

| Tool | Purpose |
|------|---------|
| **GraphQL Code Generator** | Generate TypeScript types, React hooks |
| **GraphQL Inspector** | Schema validation, breaking changes |
| **GraphQL Voyager** | Visual schema exploration |
| **Postman** | GraphQL API testing |
| **GraphiQL / GraphQL Playground** | In-browser IDE |
| **Apollo Studio** | Schema registry, analytics, tracing |

## Resources
- [GraphQL Specification](https://spec.graphql.org/)
- [GraphQL.org](https://graphql.org/)
- [Apollo GraphQL Docs](https://www.apollographql.com/docs/)
- [How to GraphQL](https://www.howtographql.com/)
- [GraphQL Weekly](https://graphqlweekly.com/)