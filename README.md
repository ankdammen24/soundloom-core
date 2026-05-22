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
