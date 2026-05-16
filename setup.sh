#!/usr/bin/env bash
set -e

# Setup script for local media-platform development.
# Goal: ensure both repos have complete local env files without overwriting existing secrets.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/music-catalog-core"
FRONTEND_DIR="$ROOT_DIR/soundloom-core"

# Fallback for environments where scripts currently live inside soundloom-core.
if [[ ! -d "$BACKEND_DIR" && -d "$ROOT_DIR/../music-catalog-core" ]]; then
  BACKEND_DIR="$ROOT_DIR/../music-catalog-core"
fi
if [[ ! -d "$FRONTEND_DIR" && -f "$ROOT_DIR/package.json" ]]; then
  FRONTEND_DIR="$ROOT_DIR"
fi

ensure_kv() {
  local file="$1"
  local key="$2"
  local value="$3"

  [[ -f "$file" ]] || touch "$file"
  if grep -Eq "^[[:space:]]*${key}=" "$file"; then
    return 0
  fi

  printf '%s=%s\n' "$key" "$value" >> "$file"
}

# Merge all KEY=VALUE rows from a template file into target, but only for missing keys.
merge_env_template() {
  local target_file="$1"
  local template_file="$2"

  [[ -f "$target_file" ]] || touch "$target_file"
  [[ -f "$template_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    # skip comments/empty lines/non-assignment rows
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue

    local key="${line%%=*}"
    local value="${line#*=}"

    # normalize key spaces and validate shell-like env key format
    key="$(printf '%s' "$key" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    ensure_kv "$target_file" "$key" "$value"
  done < "$template_file"
}

check_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :$port )" 2>/dev/null | tail -n +2 | grep -q .; then
      echo "⚠️  Port $port används redan av en annan process."
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "⚠️  Port $port används redan av en annan process."
    fi
  else
    echo "⚠️  Kunde inte kontrollera port $port (saknar ss/lsof)."
  fi
}

echo "[1/8] Kontrollerar Node.js ..."
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js saknas. Installera Node.js 20+ och kör igen."
  exit 1
fi

NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "⚠️  Node-version är lägre än 20: $(node -v)"
fi

echo "[2/8] Kontrollerar npm ..."
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm saknas. Installera npm och kör igen."
  exit 1
fi

echo "[3/8] Kontrollerar projektmappar ..."
if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "❌ Hittar inte music-catalog-core. Förväntad plats: $ROOT_DIR/music-catalog-core eller ../music-catalog-core"
  exit 1
fi
if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "❌ Hittar inte soundloom-core. Förväntad plats: $ROOT_DIR/soundloom-core"
  exit 1
fi

BACKEND_ENV="$BACKEND_DIR/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env.local"

BACKEND_TEMPLATE="$BACKEND_DIR/.env.example"
FRONTEND_TEMPLATE_LOCAL="$FRONTEND_DIR/.env.local.example"
FRONTEND_TEMPLATE="$FRONTEND_DIR/.env.example"

echo "[4/8] Säkerställer env-filer och fyller saknade variabler ..."
[[ -f "$BACKEND_ENV" ]] || touch "$BACKEND_ENV"
[[ -f "$FRONTEND_ENV" ]] || touch "$FRONTEND_ENV"

# Pull in all defaults from existing template files, without overwriting existing env values.
merge_env_template "$BACKEND_ENV" "$BACKEND_TEMPLATE"
merge_env_template "$FRONTEND_ENV" "$FRONTEND_TEMPLATE_LOCAL"
merge_env_template "$FRONTEND_ENV" "$FRONTEND_TEMPLATE"

# Required platform-specific defaults.
ensure_kv "$BACKEND_ENV" "NODE_ENV" "development"
ensure_kv "$BACKEND_ENV" "PORT" "3001"
ensure_kv "$BACKEND_ENV" "FRONTEND_ORIGIN" "http://localhost:3000"
ensure_kv "$BACKEND_ENV" "R2_BUCKET_NAME" "mrq-music-masters"
ensure_kv "$BACKEND_ENV" "R2_UPLOAD_PREFIX" "staging/uploads/"
ensure_kv "$FRONTEND_ENV" "MUSIC_API_URL" "http://localhost:3001"

echo "[5/8] Installerar dependencies (music-catalog-core) ..."
( cd "$BACKEND_DIR" && npm install )

echo "[6/8] Installerar dependencies (soundloom-core) ..."
( cd "$FRONTEND_DIR" && npm install )

echo "[7/8] Skapar lokala storage-mappar ..."
mkdir -p "$BACKEND_DIR/storage/staging/uploads"
mkdir -p "$BACKEND_DIR/storage/temp"
mkdir -p "$BACKEND_DIR/storage/cache"
mkdir -p "$BACKEND_DIR/storage/waveforms"

echo "[8/8] Kontrollerar portar ..."
check_port 3000
check_port 3001

echo
echo "✅ Setup klar"
echo "- Env-filer har fyllts med saknade defaultvärden (utan overwrite av befintliga secrets)."
echo "- Frontend proxar API via MUSIC_API_URL=http://localhost:3001."
echo "Nästa steg:"
echo "1) chmod +x setup.sh start-dev.sh stop-dev.sh"
echo "2) ./start-dev.sh"
echo "3) Öppna Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
