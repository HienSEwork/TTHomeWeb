#!/usr/bin/env node
/*
 * npm run frontend [-- web|admin] [--dry-run]
 * Installs frontend dependencies when they are missing or broken, then starts
 * the public web (http://localhost:3000) and the admin (http://localhost:3001/admin).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run, runParallel } from "./lib/proc.mjs";

const frontendDir = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend");
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const wanted = argv.filter((a) => !a.startsWith("--"));

const APPS = [
  { name: "web", workspace: "@tthome/web", url: "http://localhost:3000" },
  { name: "admin", workspace: "@tthome/admin", url: "http://localhost:3001/admin" },
];
const apps = wanted.length ? APPS.filter((a) => wanted.includes(a.name)) : APPS;
if (apps.length === 0) {
  process.stderr.write(`Không có app "${wanted.join(", ")}". Chọn web hoặc admin.\n`);
  process.exit(1);
}

// A partial node_modules (for example after OneDrive sync removed files) breaks next dev; reinstall instead.
const healthy = ["next/package.json", "next/dist/pages/_error.js", "react/package.json", "tailwindcss/package.json"].every((p) =>
  existsSync(join(frontendDir, "node_modules", p)),
);
if (!healthy) {
  process.stdout.write("Thư viện frontend thiếu hoặc hỏng, đang cài lại (npm ci)...\n");
  const code = await run("npm", ["ci"], { cwd: frontendDir, dryRun });
  if (code !== 0) process.exit(code);
}

for (const a of apps) process.stdout.write(`${a.name}: ${a.url}\n`);
process.exit(
  await runParallel(
    apps.map((a) => ({ label: a.name, cmd: "npm", args: ["run", "dev", "-w", a.workspace], cwd: frontendDir })),
    { dryRun },
  ),
);
