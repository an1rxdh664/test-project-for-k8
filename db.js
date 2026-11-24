// Shared DB helper. pg is loaded lazily so the server still starts
// (and /healthz still answers) when no database is configured.
let pool = null;
let schemaReady = false;

function configured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!configured()) return null;
  if (!pool) {
    const { Pool } = require("pg");
    const cfg = {
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    };
    if (process.env.DB_SSL === "true") cfg.ssl = { rejectUnauthorized: false };
    pool = new Pool(cfg);
    // Without this handler a dropped connection would crash the process.
    pool.on("error", (err) => console.error("pg pool error:", err.message));
  }
  return pool;
}

async function ensureSchema() {
  if (schemaReady) return;
  const p = getPool();
  await p.query(`CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  schemaReady = true;
}

async function closePool() {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end().catch(() => {});
  }
}

module.exports = { configured, getPool, ensureSchema, closePool };
