#!/usr/bin/env node
/*
 * npm run backend [-- <service...>] [--skip-build] [--skip-migrate] [--dry-run]
 *   1. build every module once (mvnw install, tests skipped)
 *   2. run each service's Flyway migrations, one service at a time
 *   3. start the services side by side; Ctrl+C stops them all
 * npm run backend:migrate  only does 1 and 2.
 * npm run backend:run      only does 1 and 3 (Spring still migrates on startup).
 *
 * Settings come from backend/.env (see backend/.env.example). Each service has its own database role;
 * set <SERVICE>_DB_PASSWORD (e.g. IDENTITY_DB_PASSWORD) when the roles do not share DB_PASSWORD.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverServices, mergeEnv, missingKeys, parseEnv, selectServices, serviceDbEnv } from "./lib/backend-config.mjs";
import { run, runParallel } from "./lib/proc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = join(root, "backend");
// Absolute path: cmd.exe may be set not to look in the current directory (NoDefaultCurrentDirectoryInExePath).
const mvnw = process.platform === "win32" ? `"${join(backendDir, "mvnw.cmd")}"` : "./mvnw";

const argv = process.argv.slice(2);
const mode = ["migrate", "run", "all", "check"].includes(argv[0]) ? argv.shift() : "all";
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const names = argv.filter((a) => !a.startsWith("--"));
const dryRun = flags.has("--dry-run");

function fail(message) {
  process.stderr.write(`\x1b[31m${message}\x1b[0m\n`);
  process.exit(1);
}

function step(message) {
  process.stdout.write(`\n\x1b[1m> ${message}\x1b[0m\n`);
}

// Settings may live in the repo-root .env, in backend/.env, or both; a filled-in value in backend/.env wins.
const envFiles = [join(root, ".env"), join(backendDir, ".env")].filter((f) => existsSync(f));
if (envFiles.length === 0 && !dryRun) {
  fail("Chưa có .env. Sao chép backend/.env.example thành backend/.env (hoặc .env ở thư mục gốc) rồi điền thông tin Supabase, JWT_SECRET, OTP_PEPPER.");
}
const fileEnv = mergeEnv(envFiles.map((f) => parseEnv(readFileSync(f, "utf8"))));
const env = { ...fileEnv, ...process.env };
const missing = missingKeys(env);
if (missing.length && !dryRun) fail(`.env còn thiếu: ${missing.join(", ")}`);

let services;
try {
  services = selectServices(discoverServices(backendDir), names);
} catch (e) {
  fail(e.message);
}
process.stdout.write(`Service: ${services.map((s) => `${s.short}:${s.port}`).join(", ")}\n`);

async function build() {
  if (flags.has("--skip-build")) return;
  step("Build backend (bỏ qua test; muốn chạy test dùng ./mvnw clean verify)");
  const code = await run(mvnw, ["-q", "-B", "-DskipTests", "install"], { cwd: backendDir, dryRun });
  if (code !== 0) fail("Build backend lỗi. Xem log Maven ở trên.");
}

async function flywayVersion() {
  if (dryRun) return "<flyway.version>";
  const { spawnSync } = await import("node:child_process");
  const res = spawnSync(mvnw, ["-q", "-N", "help:evaluate", "-Dexpression=flyway.version", "-DforceStdout"], {
    cwd: backendDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const version = res.stdout.trim().split(/\r?\n/).pop();
  if (!version || !/^\d+\.\d+/.test(version)) fail("Không đọc được phiên bản Flyway từ backend/pom.xml.");
  return version;
}

/** goal "migrate" applies pending migrations; "info" only reads the migration history and changes nothing. */
async function flyway(goal) {
  if (goal === "migrate" && flags.has("--skip-migrate")) return;
  const version = await flywayVersion();
  for (const s of services) {
    step(`${goal === "info" ? "Kiểm tra" : "Migration"} ${s.short} (schema ${s.schema}, ${s.migrationCount} file V2+)`);
    const db = serviceDbEnv(s, env);
    // Flyway reads FLYWAY_* variables; passing them as env keeps the password out of the process list.
    const flywayEnv = {
      FLYWAY_URL: env.FLYWAY_URL || env.SUPABASE_DB_URL,
      FLYWAY_USER: db.user,
      FLYWAY_PASSWORD: db.password,
      FLYWAY_SCHEMAS: s.schema,
      FLYWAY_DEFAULT_SCHEMA: s.schema,
      FLYWAY_LOCATIONS: `filesystem:${join(s.dir, "src/main/resources/db/migration")}`,
      FLYWAY_BASELINE_ON_MIGRATE: "true",
      FLYWAY_BASELINE_VERSION: "1",
    };
    const code = await run(mvnw, [...(goal === "info" ? ["-ntp"] : ["-q"]), "-B", "-pl", `services/${s.name}`, `org.flywaydb:flyway-maven-plugin:${version}:${goal}`], {
      cwd: backendDir,
      env: flywayEnv,
      dryRun,
    });
    const hint = `${s.short}: kiểm tra ${db.passwordKey}, SUPABASE_DB_URL/FLYWAY_URL và role ${db.user ?? "?"}`;
    if (code !== 0 && goal !== "info") fail(`Lỗi khi migrate. ${hint}.`);
    if (code !== 0) failed.push(hint);
  }
  return failed;
}
const failed = [];

function jarOf(service) {
  const target = join(service.dir, "target");
  if (dryRun && !existsSync(target)) return join(target, `${service.name}.jar`);
  const jar = existsSync(target) ? readdirSync(target).find((f) => f.endsWith(".jar") && !f.endsWith("-plain.jar")) : undefined;
  if (!jar) fail(`Không thấy file jar của ${service.name}. Bỏ --skip-build để build lại.`);
  return join(target, jar);
}

async function start() {
  step(`Chạy ${services.length} service (Ctrl+C để dừng tất cả)`);
  const tasks = services.map((s) => {
    const db = serviceDbEnv(s, env);
    return {
      label: s.short,
      cmd: "java",
      args: [env.BACKEND_JAVA_OPTS ?? "-Xmx384m", "-jar", jarOf(s)],
      cwd: s.dir,
      env: { ...fileEnv, DB_PASSWORD: db.password ?? "", ...(db.user ? { DB_USER: db.user } : {}) },
    };
  });
  process.exit(await runParallel(tasks, { dryRun }));
}

if (mode === "check") {
  const problems = await flyway("info");
  process.stdout.write(`\nĐã kiểm tra ${services.length} service, ${services.length - problems.length} kết nối được. Không có gì bị thay đổi trong database.\n`);
  if (problems.length) fail(`Không kết nối được:\n- ${problems.join("\n- ")}`);
  process.exit(0);
}
await build();
if (mode !== "run") await flyway("migrate");
if (mode !== "migrate") await start();
