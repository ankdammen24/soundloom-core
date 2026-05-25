# Catalogus Musicus Frontend

Maintainable Vite + React frontend for **Catalogus Musicus**.

## Tech stack

- Vite 7
- React 19
- TanStack Router + TanStack Query
- Clerk (frontend auth)
- Tailwind CSS + shadcn/ui

## Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required:

- `VITE_API_BASE_URL=https://api.mediarosenqvist.com`
- `VITE_CLERK_PUBLISHABLE_KEY=` (set your Clerk publishable key)

## Local development

```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Production build and preview

```bash
npm run build
npm run preview
```

## API behavior

- All API calls are routed through `src/lib/api.ts`.
- Public health checks (`/health*`) are called without Authorization headers.
- Protected API endpoints attach `Authorization: Bearer <clerk-token>` when available.
- API base URL is controlled by `VITE_API_BASE_URL`.

## Main pages

- Dashboard
- Status
- Artists
- Releases
- Tracks
- Assets
- Uploads
- Processing
- Organizations
- Distribution
- Settings

## Deployment

1. Build with `npm run build`.
2. Deploy static/server bundle according to your hosting target.
3. Set environment variables in your hosting platform (`VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`).


## Backend auth + API key rollout notes

This repository is the frontend/proxy layer. The full auth hardening and API key data model requested for `music-catalog-core` must be implemented in the backend service itself.

To support that rollout from this frontend repo:

- `.env.example` now includes backend security variables (`JWT_*`, `REFRESH_TOKEN_*`, `API_KEY_SECRET`, CORS and rate-limit settings).
- Server proxy mappings include versioned auth and API key route aliases (for `/api/auth/*` and `/api/api-keys` to `/api/v1/*`).

### Verification commands (against backend)

Use these commands after backend deployment to verify behavior:

```bash
# 1) login
curl -i -X POST https://api.mediarosenqvist.com/api/v1/auth/login   -H 'Content-Type: application/json'   -d '{"email":"admin@example.com","password":"<password>"}'

# 2) refresh token
curl -i -X POST https://api.mediarosenqvist.com/api/v1/auth/refresh   -H 'Content-Type: application/json'   -d '{"refresh_token":"<refresh-token>"}'

# 3) create API key (admin token)
curl -i -X POST https://api.mediarosenqvist.com/api/v1/api-keys   -H 'Content-Type: application/json'   -H 'Authorization: Bearer <admin-access-token>'   -d '{"name":"CI key","scopes":["catalog:read"]}'

# 4) call catalog endpoint with API key
curl -i https://api.mediarosenqvist.com/api/v1/catalog   -H 'X-API-Key: <mrq_live_or_test_key>'

# 5) revoke API key
curl -i -X DELETE https://api.mediarosenqvist.com/api/v1/api-keys/<api-key-id>   -H 'Authorization: Bearer <admin-access-token>'

# 6) confirm revoked key fails (expect 401/403)
curl -i https://api.mediarosenqvist.com/api/v1/catalog   -H 'X-API-Key: <revoked-key>'
```
