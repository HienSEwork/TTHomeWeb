import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { discoverServices, mergeEnv, migrateDbEnv, missingKeys, parseEnv, parseServiceYaml, selectServices, serviceDbEnv, withoutMigrateDb } from "./backend-config.mjs";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "../../backend");

test("parseEnv reads keys, skips comments and strips quotes", () => {
  const env = parseEnv('# comment\nA=1\nB = "two words"\n\nC=\'x=y\'\nbroken\n');
  assert.deepEqual(env, { A: "1", B: "two words", C: "x=y" });
});

test("parseServiceYaml finds port, Flyway schema and role", () => {
  const yml = [
    "server:",
    "  port: 8083",
    "spring:",
    "  datasource:",
    "    username: ${DB_USER:inventory_svc.${SUPABASE_PROJECT_REF}}",
    "  flyway:",
    "    schemas: inventory",
  ].join("\n");
  assert.deepEqual(parseServiceYaml(yml), { port: 8083, schema: "inventory", role: "inventory_svc" });
});

test("discoverServices reads every real service", () => {
  const services = discoverServices(backendDir);
  assert.equal(services.length, 11);
  for (const s of services) {
    assert.ok(s.port, `${s.name} has a port`);
    assert.ok(s.schema, `${s.name} has a Flyway schema`);
    assert.ok(s.role, `${s.name} has a database role`);
  }
  const identity = services.find((s) => s.short === "identity");
  assert.equal(identity.port, 8081);
  assert.ok(identity.migrationCount >= 1);
});

test("selectServices accepts short names, full names and ports", () => {
  const all = discoverServices(backendDir);
  assert.deepEqual(selectServices(all, ["identity", "listing-service", "8084"]).map((s) => s.short), ["identity", "listing", "search"]);
  assert.equal(selectServices(all, []).length, all.length);
  assert.throws(() => selectServices(all, ["nope"]), /Không có service "nope"/);
});

test("serviceDbEnv prefers a per-service password and builds the role name", () => {
  const service = { short: "meey-sync", role: "sync_svc" };
  const env = { SUPABASE_PROJECT_REF: "abc", DB_PASSWORD: "shared", MEEY_SYNC_DB_PASSWORD: "own" };
  assert.deepEqual(serviceDbEnv(service, env), { user: "sync_svc.abc", password: "own", passwordKey: "MEEY_SYNC_DB_PASSWORD" });
  assert.equal(serviceDbEnv(service, { ...env, MEEY_SYNC_DB_PASSWORD: undefined }).password, "shared");
  assert.deepEqual(serviceDbEnv(service, { ...env, MEEY_SYNC_DB_PASSWORD: "" }), { user: "sync_svc.abc", password: "shared", passwordKey: "DB_PASSWORD" });
});

test("mergeEnv lets a later file win only with a filled-in value", () => {
  const root = { SUPABASE_DB_URL: "jdbc:root", DB_PASSWORD: "root", MAIL_HOST: "smtp" };
  const backend = { SUPABASE_DB_URL: "", DB_PASSWORD: "backend", EXTRA: "" };
  assert.deepEqual(mergeEnv([root, backend]), { SUPABASE_DB_URL: "jdbc:root", DB_PASSWORD: "backend", MAIL_HOST: "smtp" });
});

test("missingKeys lists what is required", () => {
  assert.deepEqual(missingKeys({ SUPABASE_DB_URL: "x" }), ["SUPABASE_PROJECT_REF", "JWT_SECRET"]);
});

test("migrateDbEnv uses the migration account only when both its keys are set", () => {
  const service = { short: "crm", role: "crm_svc" };
  const base = { SUPABASE_PROJECT_REF: "abc", DB_PASSWORD: "shared" };
  assert.deepEqual(migrateDbEnv(service, { ...base, MIGRATE_DB_USER: "postgres.abc", MIGRATE_DB_PASSWORD: "admin" }), {
    user: "postgres.abc",
    password: "admin",
    passwordKey: "MIGRATE_DB_PASSWORD",
  });
  assert.deepEqual(migrateDbEnv(service, { ...base, MIGRATE_DB_USER: "postgres.abc" }), serviceDbEnv(service, base));
});

test("withoutMigrateDb keeps the migration account away from running services", () => {
  assert.deepEqual(withoutMigrateDb({ A: "1", MIGRATE_DB_USER: "u", MIGRATE_DB_PASSWORD: "p" }), { A: "1" });
});
