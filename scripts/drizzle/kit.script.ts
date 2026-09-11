import { execSync } from "node:child_process";

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

const command = "drizzle-kit " + args.join(" ");
console.log({ command });

try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  console.error("Command execution failed:", error);
  process.exit(1);
}
