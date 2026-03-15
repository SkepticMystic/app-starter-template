# Testing Patterns

**Analysis Date:** 2026-03-07

## Test Framework

**Runner:**

- Vitest (^4.0.18)
- No explicit `vitest.config.*` file found — uses Vite config from `vite.config.ts`

**Assertion Library:**

- Vitest built-in (`expect`)

**Run Commands:**

```bash
pnpm test          # Run in watch mode (vitest)
pnpm test:run      # Single run (vitest run)
pnpm test:ui       # Open Vitest UI (vitest --ui)
```

**Coverage:**

- No coverage configuration detected; no coverage threshold enforced

## Test File Organization

**Location:**

- Co-located with source files in the same directory

**Naming:**

- `*.test.ts` for TypeScript tests (e.g., `strings.test.ts`, `result.test.ts`)
- No `*.spec.*` files found

**Known test files:**

- `src/lib/utils/strings.test.ts` — `Strings` utility
- `src/lib/utils/result.test.ts` — `result` utility
- `src/lib/utils/guard.test.ts` — `Guard` utility
- `src/lib/utils/json.test.ts` — `Json` utility
- `src/lib/utils/dates.test.ts` — `Dates` utility
- `src/lib/utils/format.test.ts` — `Format` utility
- `src/lib/utils/urls.test.ts` — `Url` utility
- `src/lib/utils/array/array.test.ts` — `Arrays` utility
- `src/lib/schema/query/query.schema.test.ts` — `query_schema` / `where_schema`

## Test Structure

**Suite Organization:**

```typescript
import { describe, expect, it } from "vitest";
import { MyUtil } from "./my.util";

describe("MyUtil", () => {
  describe("method_name", () => {
    it("should do expected behavior", () => {
      expect(MyUtil.method_name(input)).toBe(expected);
    });

    it("should handle edge case", () => {
      expect(MyUtil.method_name(edgeInput)).toBeUndefined();
    });
  });
});
```

**Always use named imports** from vitest: `import { describe, expect, it } from "vitest"`

**Patterns:**

- Two-level nesting: outer `describe` = module/namespace name, inner `describe` = method name
- `it("should ...")` — description always starts with "should"
- No `beforeEach`/`afterEach` observed — test data set up inline per suite or as module-level constants
- No async tests observed in utility tests (all synchronous)
- Test data defined as module-level constants for shared fixtures within a file

## Mocking

**No mocking detected** in existing tests — all tested code is pure utility functions with no external dependencies.

**Expected approach for future tests involving external dependencies:**

- Use `vi.mock()` for module mocking (Vitest built-in)
- Services are structured to support environment-based swapping (dev vs prod) instead of mocks:
  ```typescript
  // src/lib/server/services/email.service.ts
  export const EmailService = dev ? of_console_log : of_resend;
  ```

## Fixtures and Factories

**Test Data Pattern:**

```typescript
// Inline factory function pattern (from array.test.ts)
type TestResource = Resource<{ name: string; value: number }>;

const createResource = (
  id: string,
  name: string,
  value: number,
): TestResource => ({
  id,
  name,
  value,
});

const testData: TestResource[] = [
  createResource("1", "first", 10),
  createResource("2", "second", 20),
  createResource("3", "third", 30),
];
```

**Location:** Inline within test files — no shared fixtures directory observed.

## Test Types

**Unit Tests:**

- Scope: Pure utility functions and schema validators
- Approach: Input → output assertions, edge case coverage
- All current tests are unit tests

**Integration Tests:**

- Not found in codebase

**E2E Tests:**

- Not found; Playwright not installed

## Common Patterns

**Discriminated union result checking:**

```typescript
// Testing result.util functions — check ok before accessing data
it("should create success result with data", () => {
  const res = result.suc({ value: 123 });
  expect(res.ok).toBe(true);
  if (res.ok) {
    expect(res.data).toEqual({ value: 123 });
  }
});
```

**Error path testing:**

```typescript
it("should create error result with error", () => {
  const res = result.err({ message: "failed" });
  expect(res.ok).toBe(false);
  if (!res.ok) {
    expect(res.error).toEqual({ message: "failed" });
  }
});
```

**Throw testing (Zod schema validation):**

```typescript
it("should enforce max limit", () => {
  expect(() => {
    schema.parse({ where: { ... }, limit: 200 });
  }).toThrow();
});
```

**Immutability testing (arrays):**

```typescript
it("should not mutate original array", () => {
  const original = [...testData];
  Arrays.remove(testData, "1");
  expect(testData).toEqual(original);
});
```

**Schema default value testing:**

```typescript
it("should apply defaults", () => {
  const result = schema.parse({ where: { name: { ilike: "test" } } });
  expect(result.offset).toBe(0);
  expect(result.limit).toBe(10);
});
```

## Coverage

**Requirements:** None enforced
**Coverage tool:** Not configured
**Observation:** Testing coverage is limited to `src/lib/utils/` and `src/lib/schema/`. Server services, remote functions, Svelte components, and route handlers have no tests.

## What Is Tested

| Area                               | Coverage               |
| ---------------------------------- | ---------------------- |
| `src/lib/utils/` pure utilities    | Covered                |
| `src/lib/schema/` Zod validators   | Covered (query schema) |
| `src/lib/server/services/`         | Not tested             |
| `src/lib/remote/` remote functions | Not tested             |
| `src/routes/` load functions       | Not tested             |
| Svelte components                  | Not tested             |

---

_Testing analysis: 2026-03-07_
