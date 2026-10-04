import { execFileSync } from "node:child_process";

/**
 * This list exists so a typo gets our error instead of drizzle-kit's, which means a
 * stale entry inverts the guard's whole purpose: `status` and `create` were in here
 * and are **not** v1 commands, so `pnpm _db status` passed this check and then
 * `execSync`'d a command that does not exist. `export`, `skills` and `mcp` are v1
 * additions that were missing, so they were rejected despite working.
 */
const SUBCOMMANDS = [
  "generate",
  "migrate",
  "check",
  "push",
  "pull",
  "up",
  "studio",
  "export",
  "skills",
  "mcp",
];

const args = process.argv.slice(2);
// Bound to a local so the emptiness check narrows it. Under
// `noUncheckedIndexedAccess`, `args[0]` stays `string | undefined` however many
// times `args.length` has been tested.
const subcommand = args[0];

if (!subcommand) {
  console.error(
    `No subcommand provided. Please use one of: ${SUBCOMMANDS.join(", ")}`,
  );
  process.exit(1);
} else if (!SUBCOMMANDS.includes(subcommand)) {
  console.error(
    `Invalid subcommand. Please use one of: ${SUBCOMMANDS.join(", ")}`,
  );
  process.exit(1);
}

console.log({ command: ["drizzle-kit", ...args] });

try {
  // An argument array, not a joined string: a shell would split a quoted
  // value such as `--hints '[…]'` at its spaces and strip its quotes.
  execFileSync("drizzle-kit", args, { stdio: "inherit" });
} catch (error) {
  console.error("Command execution failed:", error);
  process.exit(1);
}
