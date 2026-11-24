// Usage: node migrate.js expand|verify|contract
// Safe to run many times. Never deletes data.
const db = require("./db");
const phase = process.argv[2];

async function main() {
  if (!["expand", "verify", "contract"].includes(phase)) {
    console.error("usage: migrate.js expand|verify|contract");
    process.exit(2);
  }
  if (!db.configured()) {
    // The platform's migration Job does not receive secrets, so DATABASE_URL
    // may be missing here. The app creates its table itself on first use.
    console.log(`[${phase}] DATABASE_URL not set - nothing to do, exiting OK`);
    return;
  }
  const p = db.getPool();
  if (phase === "expand") {
    await db.ensureSchema();
    await p.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source TEXT");
    console.log("[expand] table submissions ready, column source added");
  } else if (phase === "verify") {
    const r = await p.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'submissions'"
    );
    const have = r.rows.map((x) => x.column_name);
    const need = ["id", "name", "email", "message", "created_at", "source"];
    const missing = need.filter((c) => !have.includes(c));
    if (missing.length) {
      console.error("[verify] missing columns: " + missing.join(", "));
      process.exit(1);
    }
    console.log("[verify] schema OK");
  } else {
    console.log("[contract] no legacy columns to remove - nothing to do");
  }
}

main()
  .then(() => db.closePool())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`[${phase}] failed:`, e.message);
    process.exit(1);
  });
