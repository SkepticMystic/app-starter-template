import { vi, type Mock } from "vite-plus/test";

/** The knobs for the `#lib/auth` mock in `./setup.ts`. */
const store = globalThis as Record<string, unknown>;

export const auth_mock: {
  /** Answers "signed out" by default. */
  getSession: Mock;
  /** Answers "not a Better-Auth error code" by default. */
  is_ba_error_code: Mock;
} = (store["__mock_auth"] ??= {
  getSession: vi.fn(async () => null),
  is_ba_error_code: vi.fn(() => false),
}) as never;
