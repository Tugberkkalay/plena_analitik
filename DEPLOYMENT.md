# Railway POC Deployment

The production image serves the Vite SPA and FastAPI API from one HTTPS origin.
MongoDB must remain private inside the Railway project.

## Services

1. Create a Railway project in an EU region.
2. Add the official MongoDB template. Do not enable its public TCP proxy.
3. Add this GitHub repository as the `Plenalitik` service.
4. Attach a volume at `/app/backend/uploads` for customer logos.
5. Generate a public HTTPS domain only for the `Plenalitik` service.

## Required application variables

```text
APP_ENV=production
COOKIE_SECURE=true
DB_NAME=plenalitik_poc
MONGO_URL=${{MongoDB.MONGO_URL}}
JWT_SECRET=<random value of at least 64 characters>
ADMIN_EMAIL=<POC administrator email>
ADMIN_PASSWORD=<unique value of at least 16 characters>
SEED_DEMO_DATA=false
MIGRATE_LEGACY_BRANCH_DATA=false
ENABLE_PUBLIC_DASHBOARD_SHARING=false
```

`EMERGENT_LLM_KEY` should remain unset so no data is sent to an external LLM.
`CORS_ORIGINS` can remain empty because the frontend and API share one origin.

## Verification gates

- `/api/health` returns HTTP 200.
- `/api/dashboard/overview` returns HTTP 401 without a session.
- Login cookies include `Secure`, `HttpOnly`, and the expected `SameSite` policy.
- MongoDB has no public domain or TCP proxy.
- Only the application service has a public HTTPS domain.
- A hard monthly usage limit and volume backups are enabled.
