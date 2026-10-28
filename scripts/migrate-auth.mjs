import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["auth@latest", "migrate", "--yes"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exitCode = result.status ?? 1;
