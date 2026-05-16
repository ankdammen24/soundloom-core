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
