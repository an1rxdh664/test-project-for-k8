# simple-form-app

Tiny contact form (plain HTML, no CSS) that saves to Postgres. Built to pass the K8s platform tests.

## Endpoints
- `GET /` form + latest 20 submissions
- `POST /submit` save a submission
- `GET /healthz` liveness (never touches the DB)
- `GET /ready` readiness (503 only while shutting down)
- `GET /db-status` shows if the DB is configured and reachable

## Run locally
```bash
docker build -t form-app .
docker run --rm -p 8080:8080 -e DATABASE_URL='postgres://user:pass@host:5432/db?sslmode=require' form-app
```
Open http://localhost:8080

## Onboard on the platform
- Repo: your GitHub URL, branch `main`
- Build method: `dockerfile`
- Port: `8080`
- Liveness path: `/healthz`, readiness path: `/ready`
- DB mode: `shared`
- Secret name: `DATABASE_URL` (paste your DB URL when asked)
- Optional env var: `DB_SSL=true`
