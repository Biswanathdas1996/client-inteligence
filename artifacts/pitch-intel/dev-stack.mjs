import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const opts = {
  cwd: workspaceRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
};

const api = spawn("pnpm", ["--filter", "@workspace/api-server", "run", "dev"], opts);
const web = spawn("pnpm", ["--filter", "@workspace/pitch-intel", "run", "dev"], opts);

let cleaned = false;

function teardown(exitCode = 0) {
  if (cleaned) return;
  cleaned = true;
  api.kill();
  web.kill();
  process.exit(exitCode);
}

process.on("SIGINT", () => teardown(0));
process.on("SIGTERM", () => teardown(0));

api.on("exit", (code) => teardown(code ?? 0));
web.on("exit", (code) => teardown(code ?? 0));
