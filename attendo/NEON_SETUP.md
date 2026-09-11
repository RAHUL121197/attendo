# Neon PostgreSQL setup

## 1. Create the Neon database

1. Create a project in the Neon console.
2. Copy the pooled connection string from **Connect**.
3. Put it in `attendo/.env` as `DATABASE_URL`. Keep `sslmode=require` in the URL.
4. Replace `JWT_SECRET` with a long random value. Never commit `.env`.
5. Set `VITE_API_URL=http://localhost:4000` for local API-backed development.

Example (use your real values locally):

```env
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/attendo?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
```

## 2. Create tables

From `attendo/` run:

```bash
npm run db:migrate
npm run db:seed
```

This applies `server/schema.sql` and creates the demo admin with `admin@attendo.com / 123456`. Change that password immediately in a real environment.

## 3. Run locally

Terminal 1:

```bash
cd attendo
npm run server:dev
```

Terminal 2:

```bash
cd attendo
npm run dev
```

Or run both with:

```bash
npm run dev:full
```

The API health check is `http://localhost:4000/api/health` and the Vite app is `http://localhost:5173`.

## Vercel

For a separate Express deployment, configure a Node host with the `attendo` directory and set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `VITE_API_URL` in the host environment. Do not put `DATABASE_URL` or `JWT_SECRET` in Vite-exposed variables or source code. The existing Vercel AI function remains unchanged.

When using Vercel serverless functions for the API, move the route handlers under `api/` or deploy `server/index.js` on a separate backend host. The `server/` implementation is the canonical Express backend for local and production Node hosting.
