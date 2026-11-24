const http = require("http");
const db = require("./db");

const PORT = parseInt(process.env.PORT || "8080", 10);
let shuttingDown = false;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function send(res, code, body, type = "text/plain; charset=utf-8", extra = {}) {
  res.writeHead(code, { "Content-Type": type, ...extra });
  res.end(body);
}

function readBody(req, limit = 10 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) {
        reject(new Error("too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function page(notice) {
  let rows = [];
  let dbNote = "";
  if (!db.configured()) {
    dbNote = "Database not configured (set DATABASE_URL).";
  } else {
    try {
      await db.ensureSchema();
      const r = await db.getPool().query(
        "SELECT id, name, email, message, created_at FROM submissions ORDER BY id DESC LIMIT 20"
      );
      rows = r.rows;
    } catch (e) {
      dbNote = "Database error: " + e.message;
    }
  }
  const list = rows
    .map(
      (r) =>
        `<li>#${r.id} ${esc(r.name)} (${esc(r.email)}): ${esc(r.message)} [${new Date(
          r.created_at
        ).toISOString()}]</li>`
    )
    .join("\n");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Contact form</title></head>
<body>
<h1>Contact form</h1>
${notice ? `<p><b>${esc(notice)}</b></p>` : ""}
${dbNote ? `<p>${esc(dbNote)}</p>` : ""}
<form method="POST" action="/submit">
<p><label>Name<br><input name="name" required maxlength="100"></label></p>
<p><label>Email<br><input name="email" type="email" required maxlength="200"></label></p>
<p><label>Message<br><textarea name="message" required maxlength="1000" rows="4" cols="40"></textarea></label></p>
<p><button type="submit">Send</button></p>
</form>
<h2>Latest submissions</h2>
<ul>
${list || "<li>none yet</li>"}
</ul>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    // Liveness: never touches the DB, so it stays green during DB outages.
    if (req.method === "GET" && url.pathname === "/healthz") {
      return send(res, 200, "ok");
    }
    // Readiness: fails only while shutting down.
    if (req.method === "GET" && url.pathname === "/ready") {
      return shuttingDown ? send(res, 503, "shutting down") : send(res, 200, "ready");
    }
    if (req.method === "GET" && url.pathname === "/db-status") {
      let connected = false;
      if (db.configured()) {
        try {
          await db.getPool().query("SELECT 1");
          connected = true;
        } catch (_) {}
      }
      return send(
        res,
        200,
        JSON.stringify({ configured: db.configured(), connected }),
        "application/json"
      );
    }
    if (req.method === "GET" && url.pathname === "/") {
      const notice =
        url.searchParams.get("ok") === "1"
          ? "Thanks, saved."
          : url.searchParams.get("err") || "";
      return send(res, 200, await page(notice), "text/html; charset=utf-8");
    }
    if (req.method === "POST" && url.pathname === "/submit") {
      const form = new URLSearchParams(await readBody(req));
      const name = (form.get("name") || "").trim().slice(0, 100);
      const email = (form.get("email") || "").trim().slice(0, 200);
      const message = (form.get("message") || "").trim().slice(0, 1000);
      if (!name || !email || !message) {
        return send(res, 303, "", "text/plain", {
          Location: "/?err=" + encodeURIComponent("All fields required."),
        });
      }
      if (!db.configured()) {
        return send(res, 303, "", "text/plain", {
          Location: "/?err=" + encodeURIComponent("Database not configured."),
        });
      }
      try {
        await db.ensureSchema();
        await db
          .getPool()
          .query("INSERT INTO submissions (name, email, message) VALUES ($1, $2, $3)", [
            name,
            email,
            message,
          ]);
      } catch (e) {
        console.error("insert failed:", e.message);
        return send(res, 303, "", "text/plain", {
          Location: "/?err=" + encodeURIComponent("Could not save. Try again."),
        });
      }
      return send(res, 303, "", "text/plain", { Location: "/?ok=1" });
    }
    send(res, 404, "not found");
  } catch (e) {
    console.error("request error:", e.message);
    if (!res.headersSent) send(res, 500, "error");
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`listening on ${PORT}`));

function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${sig} received, shutting down`);
  server.close(async () => {
    await db.closePool();
    process.exit(0);
  });
  if (server.closeIdleConnections) server.closeIdleConnections();
  // Safety net, well under the 30s Kubernetes grace period.
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
