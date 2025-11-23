import { execSync } from "child_process";

const SUBCOMMANDS = [
  "generate",
  "migrate",
  "check",
  "push",
  "pull",
  "status",
  "create",
  "up",
  "studio",
];

const args = process.argv.slice(2);

if (!args.length) {
  console.error(
    `No subcommand provided. Please use one of: ${SUBCOMMANDS.join(", ")}`,
  );
  process.exit(1);
} else if (!SUBCOMMANDS.includes(args[0])) {
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
