import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Parse a dotenv file: KEY=value lines, # comments, optional quotes. */
export function parseEnv(text) {
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

/**
 * Read what the runner needs from a service's application.yml:
 * HTTP port, Flyway schema and the default database role prefix.
 */
export function parseServiceYaml(text) {
  const port = /^server:\s*\n\s+port:\s*(\d+)/m.exec(text)?.[1];
  const schema = /^\s+flyway:[\s\S]*?^\s+schemas:\s*([a-z_]+)/m.exec(text)?.[1];
  const role = /username:\s*\$\{DB_USER:([a-z_]+)\.\$\{SUPABASE_PROJECT_REF\}\}/.exec(text)?.[1];
  return { port: port ? Number(port) : undefined, schema, role };
}

/** Every service under backend/services, with the facts above and its migration count. */
export function discoverServices(backendDir) {
  const servicesDir = join(backendDir, "services");
  return readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(servicesDir, d.name, "pom.xml")))
    .map((d) => {
      const dir = join(servicesDir, d.name);
      const yml = join(dir, "src/main/resources/application.yml");
      const migrations = join(dir, "src/main/resources/db/migration");
      const facts = existsSync(yml) ? parseServiceYaml(readFileSync(yml, "utf8")) : {};
      const migrationCount = existsSync(migrations) ? readdirSync(migrations).filter((f) => /^V\d+__.+\.sql$/.test(f)).length : 0;
      return { name: d.name, short: d.name.replace(/-service$/, ""), dir, ...facts, migrationCount };
    })
    .sort((a, b) => (a.port ?? 0) - (b.port ?? 0));
}

/** "identity", "identity-service" or "8081" all select identity-service. */
export function selectServices(all, wanted) {
  if (wanted.length === 0) return all;
  const picked = [];
  for (const w of wanted) {
    const s = all.find((x) => x.name === w || x.short === w || String(x.port) === w);
    if (!s) throw new Error(`Không có service "${w}". Có: ${all.map((x) => x.short).join(", ")}`);
    if (!picked.includes(s)) picked.push(s);
  }
  return picked;
}

/**
 * Database credentials for one service. Each service has its own role, so a password can be set per service
 * as <SHORT>_DB_PASSWORD (e.g. IDENTITY_DB_PASSWORD, MEEY_SYNC_DB_PASSWORD); DB_PASSWORD is the fallback.
 */
export function serviceDbEnv(service, env) {
  const key = `${service.short.toUpperCase().replace(/-/g, "_")}_DB_PASSWORD`;
  const password = env[key] || env.DB_PASSWORD;
  const user = env[`${service.short.toUpperCase().replace(/-/g, "_")}_DB_USER`] || (service.role && env.SUPABASE_PROJECT_REF ? `${service.role}.${env.SUPABASE_PROJECT_REF}` : env.DB_USER);
  return { user, password, passwordKey: env[key] ? key : "DB_PASSWORD" };
}

/** Credentials for Flyway: MIGRATE_DB_USER/PASSWORD when both are set (one owner for every schema), else the service role. */
export function migrateDbEnv(service, env) {
  if (env.MIGRATE_DB_USER && env.MIGRATE_DB_PASSWORD) return { user: env.MIGRATE_DB_USER, password: env.MIGRATE_DB_PASSWORD, passwordKey: "MIGRATE_DB_PASSWORD" };
  return serviceDbEnv(service, env);
}

/** The migration account can reach every schema, so running services never receive it. */
export function withoutMigrateDb(env) {
  const { MIGRATE_DB_USER: _u, MIGRATE_DB_PASSWORD: _p, ...rest } = env;
  return rest;
}

/** Combine env files in order; a later file wins, but only with a filled-in value, so blank lines never erase one. */
export function mergeEnv(envs) {
  const out = {};
  for (const e of envs) for (const [k, v] of Object.entries(e)) if (v !== "" || !(k in out)) out[k] = v;
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== ""));
}

/** Keys every service needs before it can start. */
export function missingKeys(env) {
  return ["SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "JWT_SECRET"].filter((k) => !env[k]);
}
