---
name: mcp-builder
description: Build Model Context Protocol (MCP) servers that let AI assistants interact with external services through tools. Use when the user wants to create an MCP server to connect an AI to an API, database, or external service.
---

# MCP Server Builder

Create MCP (Model Context Protocol) servers that enable AI assistants to interact with external services through well-designed tools. The quality of an MCP server is measured by how well it enables AI to accomplish real-world tasks.

## Design Principles

**Comprehensive API coverage** — expose enough endpoints that the AI can compose operations naturally. Don't just build workflow tools; give access to the raw API surface too.

**Clear tool naming** — use consistent prefixes like `github_create_issue`, `github_list_repos`. Action-oriented names help AI agents discover the right tool.

**Actionable error messages** — errors should guide toward solutions with specific suggestions.

**Tool annotations** — mark tools with `readOnlyHint`, `destructiveHint`, `idempotentHint` so the AI understands the impact of calling them.

## Recommended Stack

- **Language**: TypeScript (best SDK support)
- **Transport**: Streamable HTTP for remote servers, stdio for local servers
- **Framework**: MCP TypeScript SDK or Python FastMCP

## Project Structure

```
my-mcp-server/
├── package.json         # TypeScript: dependencies, scripts
├── tsconfig.json        # TypeScript config
├── src/
│   ├── index.ts         # Server entry point
│   ├── tools/           # Tool implementations
│   │   ├── search.ts
│   │   └── manage.ts
│   ├── client.ts        # API client
│   └── types.ts         # Shared types
└── README.md
```

## Implementation Process

### 1. Research the API
Understand the service's API: auth, endpoints, data models, rate limits.

### 2. Plan the tools
List endpoints to implement starting with the most common operations. Each tool needs:
- Clear name
- Input schema with descriptions and constraints (use Zod in TypeScript, Pydantic in Python)
- Output schema
- Error handling

### 3. Implement
Build the server with proper auth, error handling, and pagination support.

### 4. Test
Use the MCP Inspector tool to verify everything works:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Tool Design Guidelines

```typescript
// TypeScript example
import { z } from "zod";

server.registerTool({
  name: "search_items",
  description: "Search for items matching a query",
  inputSchema: z.object({
    query: z.string().describe("Search term"),
    limit: z.number().min(1).max(100).default(20),
  }),
  outputSchema: z.object({
    items: z.array(itemSchema),
    total: z.number(),
  }),
  annotations: {
    readOnlyHint: true,
  },
  execute: async ({ query, limit }) => {
    const data = await api.search(query, limit);
    return { items: data.results, total: data.total };
  },
});
```

Use the app's `run_bash` and `write_file` tools to create and test MCP servers.
