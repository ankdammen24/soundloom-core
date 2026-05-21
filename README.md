# Soundloom — Music Catalog Frontend

Modern frontend for **Media Rosenqvist / Soundloom**, sitting on top of the
[`music-catalog-core`](https://api.mediarosenqvist.com) backend.

Stack: **TanStack Start v1** (Vite 7, React 19, SSR-ready) · **TanStack Query** ·
**Clerk** (auth) · **Tailwind v4** · **shadcn/ui** · **lucide-react**.

---

## 1. Run locally

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # production build
```

## 2. Required env variables

Create a `.env` file (already present in this repo, fill in the blanks):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the `music-catalog-core` backend. Default: `https://api.mediarosenqvist.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_…` or `pk_live_…`). Used for login + bearer token. |
| `VITE_SUPABASE_URL` | _(legacy)_ Supabase URL, kept for migration period. Safe to remove once all reads go through the API. |
| `VITE_SUPABASE_ANON_KEY` | _(legacy)_ Supabase publishable anon key. |

If `VITE_CLERK_PUBLISHABLE_KEY` is empty the app still loads, but protected
endpoints in `music-catalog-core` will reject calls with `401`.

## 3. Backend wiring (music-catalog-core)

All HTTP traffic goes through one central client: **`src/lib/api.ts`**.

- Base URL comes from `VITE_API_BASE_URL`.
- A Clerk token bridge in `src/lib/auth.tsx` registers a token getter with
  the client via `setApiTokenGetter`. Every request then adds:

  ```
  Authorization: Bearer <clerk-session-jwt>
  ```

- `/health/*` endpoints are explicitly called `anonymous: true` so the
  Platform Status page works even when signed out.
- Errors are normalized into `ApiError { status, message, body }` — UI
  surfaces both the HTTP status and the message.

### Endpoints consumed

| Area | Method · Path |
|---|---|
| Health | `GET /health`, `GET /health/database`, `GET /health/storage`, `GET /health/auth-config`, `GET /health/redis` |
| Artists | `GET /api/artists`, `GET /api/artists/:id`, `POST /api/artists` |
| Releases | `GET /api/releases`, `GET /api/releases/:id`, `POST /api/releases` |
| Tracks | `GET /api/tracks`, `GET /api/tracks/:id`, `POST /api/tracks` |
| Uploads | `POST /api/assets/uploads/init` → signed URL, then `PUT` to that URL, then `POST /api/assets/uploads/complete` |

## 4. App routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/dashboard` | Authenticated dashboard (Clerk `<SignedIn>`) |
| `/status` | Platform status — live polling of `/health/*` |
| `/artists`, `/artists/$id` | Artist list + detail |
| `/releases`, `/releases/$id` | Release list + detail |
| `/tracks`, `/tracks/$id` | Track list + detail |
| `/uploads` | Init → PUT signed URL → Complete flow |
| `/settings`, `/profile`, `/sign-in`, `/sign-up` | Account |

## 5. Auth flow

1. `AuthProvider` (in `src/lib/auth.tsx`) wraps the app with `ClerkProvider`.
2. `ApiTokenBridge` registers `getToken()` with the API client on mount.
3. Pages that need the user check `<SignedIn>` / `<SignedOut>` from
   `@clerk/clerk-react`. Server-side calls always carry the bearer
   token automatically once `useAuth().isLoaded === true`.

## 6. GitHub

Repo: **`soundloom-core`** — the existing repo is reused, no fork.
Push from local or let Lovable sync; the GitHub integration is bidirectional.
