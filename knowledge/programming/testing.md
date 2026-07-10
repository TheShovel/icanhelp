# Testing & CI/CD

## Types of Tests
- **Unit test**: test smallest piece (function, class) in isolation — fast, deterministic
  - Mock external dependencies (DB, API, filesystem)
- **Integration test**: test how modules work together (API + DB, service + service)
- **End-to-end (E2E)**: test full flow from UI to DB — slowest, most realistic
- **Snapshot test**: compare output to stored snapshot (catches unexpected changes)
- **Regression test**: re-running tests after changes to catch new bugs
- **Smoke test**: quick check that critical paths work (often used in CI/deployment)

## Test Structure (AAA Pattern)
```
// Arrange — set up test data, mocks, environment
// Act — execute the code under test
// Assert — verify expected outcome
```

## Testing in Node.js
```javascript
// Using Node.js built-in test (Node 18+)
import { test, describe, mock } from "node:test"
import assert from "node:assert"

describe("UserService", () => {
  test("creates user", async () => {
    const db = mock.fn(() => Promise.resolve({ id: 1 }))
    const svc = new UserService(db)
    const user = await svc.create({ name: "Alice" })
    assert.strictEqual(user.id, 1)
    assert.strictEqual(db.mock.calls.length, 1)
  })
})
```

## Testing Pyramid
```
     /\
    /E2E\       — few, slow, expensive
   / Integ \    — some, medium
  /  Unit    \  — many, fast, cheap
```

## Coverage
- Line coverage: what % of lines executed
- Branch coverage: what % of if/else branches taken
- Statement/function coverage variants
- 80% is a good target (100% doesn't mean bug-free, diminishing returns)
- Don't write tests just for coverage — test behavior, not implementation

## CI/CD Pipeline (GitHub Actions)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## CI/CD Concepts
- **CI (Continuous Integration)**: merge code frequently, auto-test every push, catch bugs early
- **CD (Continuous Delivery)**: CI + auto-deploy to staging, manual prod (with approval)
- **CD (Continuous Deployment)**: every commit that passes tests → auto-deployed to production
- **Build artifact**: compiled code/package ready to deploy (immutable, versioned)
- **Environment**: dev (local), staging (pre-prod), production (live)
- **Feature flag**: toggle features on/off without deploy (split.io, LaunchDarkly)
- **Canary deploy**: roll out to small % of users first, monitor, then full rollout
- **Rollback**: revert to previous version if deploy causes issues

## Good Test Practices
- One assertion concept per test (or use multiple assertions on same behavior)
- Tests should be independent (not depend on order, shared state)
- Descriptive test names: "returns 404 when user not found" not "test error"
- Test edge cases: empty input, null, max length, race conditions
- Test failure paths, not just happy path
- Don't test implementation details (mocks should test interactions, not internal structure)
- Write test before code (TDD) or immediately after — write test same session
- Slow test = test you won't run (keep fast)

## Common Mistakes
- Testing the framework (don't test that Express routes work — test YOUR code)
- Brittle tests (too tightly coupled to implementation — refactoring breaks tests)
- Flaky tests (sometimes pass, sometimes fail — worse than no test, erodes trust)
- Over-mocking (mock everything = test doesn't actually test anything)
- No regression tests for bugs (when bug found, write test first, then fix)
- Tests that don't clean up (leave test users, test files in DB)
