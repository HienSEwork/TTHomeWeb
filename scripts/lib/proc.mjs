import { spawn, spawnSync } from "node:child_process";

const COLORS = [36, 33, 35, 32, 34, 91, 96, 93, 95, 92, 94];
const isWindows = process.platform === "win32";

/** Run a command to completion, streaming its output. Resolves with the exit code. */
export function run(cmd, args, { cwd, env, dryRun } = {}) {
  const line = [cmd, ...args].join(" ");
  if (dryRun) {
    process.stdout.write(`[dry-run] (${cwd ?? "."}) ${line}\n`);
    return Promise.resolve(0);
  }
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: "inherit", shell: isWindows });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

/** Prefix every line of a stream with a coloured label. */
function pipeWithLabel(stream, label, color, out) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const l of lines) out.write(`\x1b[${color}m[${label}]\x1b[0m ${l}\n`);
  });
  stream.on("end", () => {
    if (buffer) out.write(`\x1b[${color}m[${label}]\x1b[0m ${buffer}\n`);
  });
}

function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (isWindows) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGTERM");
}

/**
 * Start long-running processes side by side with labelled output.
 * Ctrl+C, or any process exiting with an error, stops all of them.
 */
export function runParallel(tasks, { dryRun } = {}) {
  if (dryRun) {
    for (const t of tasks) process.stdout.write(`[dry-run] [${t.label}] (${t.cwd ?? "."}) ${[t.cmd, ...t.args].join(" ")}\n`);
    return Promise.resolve(0);
  }
  return new Promise((resolve) => {
    const children = [];
    let stopping = false;
    const stopAll = (code) => {
      if (stopping) return;
      stopping = true;
      for (const c of children) killTree(c);
      resolve(code);
    };

    tasks.forEach((t, i) => {
      const color = COLORS[i % COLORS.length];
      const child = spawn(t.cmd, t.args, { cwd: t.cwd, env: { ...process.env, ...t.env }, shell: isWindows });
      children.push(child);
      pipeWithLabel(child.stdout, t.label, color, process.stdout);
      pipeWithLabel(child.stderr, t.label, color, process.stderr);
      child.on("exit", (code) => {
        if (stopping) return;
        process.stderr.write(`\x1b[${color}m[${t.label}]\x1b[0m đã dừng (mã ${code ?? "?"})\n`);
        if (code !== 0) stopAll(code ?? 1);
      });
    });

    process.on("SIGINT", () => stopAll(0));
    process.on("SIGTERM", () => stopAll(0));
  });
}
