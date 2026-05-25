
# Fas 1 — Konsolidering till Lovable

Mål: göra Lovable till den enda plattformen. Vi bygger en stabil grund (auth, roller, databas, storage, upload, dashboard) och rensar bort sidorna som idag pekar mot `music-catalog-core`. Review-kö, publik katalog-API, API-nycklar och riktig audio-analys kommer i kommande faser.

Antaganden från dina svar:
- En organisation (Media Rosenqvist), inga `org_id`-kolumner.
- Audio-analys: bara fält + statusflöde, ingen riktig analys.
- Behåll endast sidorna i punkt 8 av din kravspec, ta bort övriga.

## 1. Auth & roller

- Roller är redan modellerade (`user_roles` + `has_role()` + `app_role` enum med `admin`). Vi utökar enumet med `editor`, `artist`, `viewer` om de saknas och behåller `admin`.
- Login/sign-up redan på plats (Supabase Auth + Google + reset-password). Vi rör inte själva auth-flödet i denna fas.
- Profil-sidan visar nuvarande användare och roll. "Organisation" visas som fast text "Media Rosenqvist".
- En enkel `useRole()`-hook + en `<RequireRole>`-guard för att gömma UI för fel roll (admin/editor ser allt, artist ser sina egna saker, viewer är read-only).

## 2. Databas (migration)

Nya tabeller i `public` (alla med RLS påslaget, `created_at`/`updated_at` + `touch_updated_at`-trigger):

- `artists` — name, slug (unique), bio, image_url, created_by
- `releases` — artist_id (FK), title, slug, release_date, artwork_url, upc, type (single/ep/album), created_by
- `tracks` — release_id (FK, nullable för lösa singlar), artist_id, title, track_number, isrc, genre, duration_seconds, primary_audio_file_id (FK→audio_files, nullable), created_by
- `uploads` — användarens upload-intent: artist_id, release_id, track_title, genre, isrc, notes, artwork_path, status enum (`uploaded|queued|processing|analyzed|needs_review|approved|rejected|failed`), rejection_reason, created_by
- `audio_files` — upload_id (FK), storage_path, mime, size_bytes, duration_seconds, codec, sample_rate, bit_depth, channels, loudness_lufs, true_peak_dbtp, validation_errors (jsonb), processing_log (jsonb), checksum, created_at
- `processing_jobs` — upload_id, status, attempts, last_error, started_at, finished_at — stub-tabell för senare worker
- `review_items` — upload_id, assigned_to, decision (approve/reject/changes), reason, decided_at, decided_by — strukturen läggs nu, UI i fas 2
- `api_keys` — strukturen läggs nu (id, name, key_hash, prefix, created_by, revoked_at, last_used_at), UI och endpoints i fas 3
- `audit_logs` — actor_id, action, entity_type, entity_id, metadata (jsonb), created_at

`profiles` och `user_roles` behålls som de är. Inget `org_id` läggs på.

### RLS-policies (sammanfattning på vanlig svenska)

- **artists / releases / tracks**: alla inloggade kan läsa. Skapa/ändra: `admin` eller `editor`. `artist`-rollen får skapa/ändra rader där `created_by = auth.uid()`.
- **uploads**: `admin`/`editor` ser alla. `artist` ser bara sina egna. Skapa: alla inloggade utom `viewer`. Statusbyten begränsas via en SECURITY DEFINER-funktion `set_upload_status(upload_id, new_status, reason)` så att bara giltiga övergångar tillåts och bara av rätt roll.
- **audio_files / processing_jobs / review_items / audit_logs**: läs för `admin`/`editor`; insert/update bara via service role (server-functions).
- **api_keys**: bara `admin`.

## 3. Storage

Skapas via migration:

- `audio-uploads` (privat) — råa uppladdade filer, path `{user_id}/{upload_id}/{filename}`
- `artwork` (publik) — finns redan, återanvänds
- `audio-previews` (publik) — för senare faser, skapas tom

Storage-policies:
- audio-uploads: ägare (folder-prefix = auth.uid) får insert/select/delete; `admin`/`editor` får läsa allt; ingen publik åtkomst.
- artwork: insert för inloggade utom `viewer`, publik select.

## 4. Upload-flöde (UI)

Skriver om `/uploads` så att den pratar mot Supabase direkt (idag pratar den mot `music-catalog-core`):

1. Formulär: välj artist (eller "ny artist"), välj/skapa release, track-titel, genre, ISRC (valfritt), notes, artwork (valfritt), ljudfil (obligatorisk, .wav/.flac/.mp3, max 500 MB).
2. Klient laddar upp filen direkt till `audio-uploads` via Supabase Storage med progress.
3. Server-function `createUpload` (createServerFn + `requireSupabaseAuth`) skapar `uploads`-raden (status `uploaded`), motsvarande `audio_files`-rad (utan analysfält), och en `processing_jobs`-rad i status `queued` som stub.
4. UI:t visar bekräftelse och länkar till nya posten på `/processing`.

## 5. Dashboard

Skriver om `/dashboard` så att den läser counts från Supabase via en server-function `getDashboardStats`:
- total artists, releases, tracks
- pending uploads (status in `uploaded|queued|processing|analyzed`)
- items needing review (`needs_review`)
- failed processing jobs (`failed`)
- senaste 10 approved tracks (med artist + release)

## 6. Sidor som rör de övriga "punkt 8"-sidorna

I denna fas kopplar vi om till Supabase för listvyer (read-only där det räcker):
- `/artists`, `/artists/$id`, `/releases`, `/releases/$id`, `/tracks`, `/tracks/$id`: enkla listor + detaljsidor som läser från Supabase. Skapa/redigera-knappar finns men kan vara begränsade till `admin`/`editor` (full CRUD-form i fas 2 om scope tillåter).
- `/processing`: lista över uploads med deras status och processing_jobs.
- `/settings`: behåller dagens innehåll, lägger till sektion "Organisation: Media Rosenqvist" och visad roll.
- Review-queue, API keys-sidan: vi lämnar dem tomma med en "Kommer i fas 2/3"-placeholder så att menyn matchar kravspec.

## 7. Borttagning av legacy-sidor

Tas bort i denna fas (de pratar mot `music-catalog-core` och ingår inte i punkt 8):

```
_authenticated.admin.api-usage.tsx
_authenticated.admin.audit.tsx
_authenticated.admin.diagnostics.tsx
_authenticated.admin.jobs.tsx
_authenticated.admin.logs.tsx
_authenticated.admin.processing-metrics.tsx
_authenticated.admin.queues.tsx
_authenticated.admin.storage.tsx
_authenticated.admin.tsx
_authenticated.admin.workers.tsx
_authenticated.albums.tsx
_authenticated.assets.tsx
_authenticated.debug.token.tsx
_authenticated.distribution.tsx
_authenticated.library.tsx
_authenticated.organizations.tsx
_authenticated.playlists.tsx
_authenticated.rights.tsx
_authenticated.status.tsx
discover.tsx
sign-in.tsx        (duplicate av login.tsx)
sign-up.tsx        (duplicate)
```

`src/lib/api.ts` (klienten mot `music-catalog-core`) tas bort tillsammans med dess användningar. `VITE_API_BASE_URL` slutar användas.

## 8. System Overview-sida (punkt 10)

Ny route `/_authenticated/system-overview.tsx` (admin-only) med statisk men levande dokumentation: tabellöversikt, upload/review/API-flöden som diagram (text/ascii), env-variabler som används, och en "Next technical steps"-checklista (fas 2 review, fas 3 publikt API + nycklar, fas 4 riktig audio-analys).

## 9. Navigation & cleanup

Sidomeny ritas om enligt punkt 8 i kravspec: Dashboard, Artists, Releases, Tracks, Upload, Processing, Review, API keys, Settings, System Overview. Inget mer.

---

## Tekniska detaljer

- All server-logik via `createServerFn` med `requireSupabaseAuth` (denna stack använder INTE Supabase Edge Functions för app-logik). Filer: `src/lib/catalog.functions.ts`, `src/lib/uploads.functions.ts`, `src/lib/dashboard.functions.ts`.
- Reads via TanStack Query (`queryOptions` + `useSuspenseQuery`) enligt projektets standardmönster.
- Migration läggs som ETT migrationsanrop (tabeller + enums + RLS + storage-buckets + policies + trigger för `updated_at`).
- Inga nya externa hemligheter behövs i fas 1.

## Vad som INTE ingår i denna fas (medvetet)

- Riktig audio-analys (LUFS, true peak osv). Fälten finns men fylls inte.
- Review-UI med audio-spelare och godkänn/avslå-knappar. Tabellen finns, UI är placeholder.
- Publik katalog-API (`/api/public/...`) och API-nyckel-hantering. Tabellen finns, sidan är placeholder.
- Audit-log-skrivning från alla actions (tabell finns, vi fyller den i fas 2).

När fas 1 är godkänd och deployad föreslår jag fas 2 (Review-flöde + audit-logging) som nästa steg.
