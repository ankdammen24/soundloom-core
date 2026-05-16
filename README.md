# soundloom-core

soundloom-core är en TypeScript-baserad frontend för att bläddra i musik-katalogen och spela upp tracks via `music-catalog-core` API.

## API-koppling
All data hämtas via API (inte direkt från Supabase eller Cloudflare R2):
- `GET /health`
- `GET /api/v1/releases`
- `GET /api/v1/artists`
- `GET /api/v1/tracks`
- `GET /api/v1/catalog/search?q=...`
- `POST /api/v1/playback/token` med `{ trackId }`

## Miljövariabler
Skapa `.env`:

```env
NEXT_PUBLIC_MUSIC_API_URL=http://localhost:8787
```

## Köra lokalt
```bash
npm install
npm run dev
```

Öppna appen och testa sidorna `/`, `/discover`, `/releases`, `/artists`, `/tracks` samt global player längst ner.
