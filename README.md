# media-platform local development

Det här upplägget beskriver en gemensam lokal utvecklingsmiljö för två repos:

- `music-catalog-core` (backend/API)
- `soundloom-core` (frontend)

## Arkitektur och relation

`music-catalog-core` kör API:t på port **3001**.

`soundloom-core` kör frontend på port **3000** och använder server-side proxy för API-anrop vidare till backend.

Proxyflöde:

`Browser → soundloom-core /api → music-catalog-core /api/v1`

## Miljövariabler

`setup.sh` ser till att följande env-filer finns och fylls med defaultvärden utan att skriva över befintliga hemligheter:

- `music-catalog-core/.env`
- `soundloom-core/.env.local`

Minimikrav på värden:

> `setup.sh` läser även in alla saknade `KEY=VALUE` från `.env.example`/`.env.local.example` (om de finns) och lägger bara till det som saknas i målfilen.

### `music-catalog-core/.env`

```env
NODE_ENV=development
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
R2_BUCKET_NAME=mrq-music-masters
R2_UPLOAD_PREFIX=staging/uploads/
```

### `soundloom-core/.env.local`

```env
MUSIC_API_URL=http://localhost:3001
```

## Storage-princip

Inga nya Cloudflare R2-buckets ska skapas.

Använd bucket:

- `mrq-music-masters`

Upload-prefix:

- `staging/uploads/`

Objektnamn följer principen:

- `mrq-music-masters/staging/uploads/...`

Lokala kataloger för development skapas av setup:

- `storage/staging/uploads`
- `storage/temp`
- `storage/cache`
- `storage/waveforms`

## Kom igång

```bash
chmod +x setup.sh start-dev.sh stop-dev.sh
./setup.sh
./start-dev.sh
./stop-dev.sh
```

## Portar

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## Viktigt

- Skapa inga nya repos.
- Scripten är tänkta att ligga i rooten av `media-platform`, bredvid `music-catalog-core` och `soundloom-core`.

## Frontend auth (Clerk)

### Required env vars (`soundloom-core/.env.local`)

```env
MUSIC_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

> Only use Clerk **publishable** key in frontend. Never commit Clerk secret keys.

### Run locally

```bash
npm install
npm run dev
```

Open app (typically `http://localhost:3000` or the Vite URL shown in terminal).

### Test login/logout flow

1. Visit `/sign-up` and create a user (or use `/sign-in`).
2. After login you should be redirected to `/dashboard`.
3. `/dashboard` should redirect unauthenticated users to `/sign-in`.
4. In sidebar:
   - signed out: `Sign in`, `Sign up`
   - signed in: `Dashboard`, `Profile`, `UserButton`
5. Use `UserButton` to sign out and verify redirect behavior again.

### Current status (auth module)

Done:

- Clerk provider wired at root level.
- Clerk pages added: `/sign-in`, `/sign-up`, `/profile`.
- Protected route added: `/dashboard`.
- Auth-aware navigation in sidebar.
- Development-only auth debug panel (no token exposure).

Remaining:

- Connect authenticated frontend requests to upcoming `music-catalog-core` auth expectations when backend module is ready.
