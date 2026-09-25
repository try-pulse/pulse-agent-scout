import { copyFile, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const source = process.argv[2];
if (!source || basename(source) !== "pulse-agent-sdk-0.1.0.tgz") {
  console.error("Usage: npm run sync:sdk -- /path/to/pulse-agent-sdk-0.1.0.tgz");
  process.exit(1);
}

await copyFile(resolve(source), resolve("vendor/pulse-agent-sdk-0.1.0.tgz"));
const lockPath = resolve("package-lock.json");
const lock = JSON.parse(await readFile(lockPath, "utf8"));
delete lock.packages["node_modules/@pulse/agent-sdk"];
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
execFileSync("npm", ["install", "--package-lock-only", "--ignore-scripts"], { stdio: "inherit" });
const refreshed = JSON.parse(await readFile(lockPath, "utf8"));
delete refreshed.packages["node_modules/@pulse/agent-sdk"].resolved;
await writeFile(lockPath, `${JSON.stringify(refreshed, null, 2)}\n`);
console.log("SDK tarball and lockfile refreshed. Run npm ci to install.");
