# soundloom-core

soundloom-core är en TypeScript-baserad frontend för att bläddra i musik-katalogen och spela upp tracks via `music-catalog-core` API.

## API-koppling (BFF/proxy)
Browsern anropar endast interna routes i `soundloom-core`, och servern proxy:ar vidare till `music-catalog-core`.

Flöde:

`Browser → soundloom-core API proxy → music-catalog-core API`

Proxy routes:
- `GET /api/health` → `MUSIC_API_URL/api/v1/health`
- `GET /api/releases` → `MUSIC_API_URL/api/v1/releases`
- `GET /api/artists` → `MUSIC_API_URL/api/v1/artists`
- `GET /api/tracks` → `MUSIC_API_URL/api/v1/tracks`
- `GET /api/search?q=...` → `MUSIC_API_URL/api/v1/search?q=...`
- `POST /api/playback/token` → `MUSIC_API_URL/api/v1/playback/token`

Noteringar:
- Query params för GET skickas vidare oförändrade.
- JSON-body för `POST /api/playback/token` skickas vidare oförändrad.
- Proxy returnerar samma statuskod och JSON-struktur som backend.
- Om `MUSIC_API_URL` saknas eller backend inte svarar returneras tydliga JSON-fel från proxyn.

## Miljövariabler
Skapa `.env`:

```env
MUSIC_API_URL=http://localhost:3001
```

## Köra lokalt
```bash
npm install
npm run dev
```

Öppna appen och testa sidorna `/`, `/discover`, `/releases`, `/artists`, `/tracks` samt global player längst ner.
