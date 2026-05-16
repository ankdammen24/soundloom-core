#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/music-catalog-core"
FRONTEND_DIR="$ROOT_DIR/soundloom-core"

if [[ ! -d "$BACKEND_DIR" && -d "$ROOT_DIR/../music-catalog-core" ]]; then
  BACKEND_DIR="$ROOT_DIR/../music-catalog-core"
fi
if [[ ! -d "$FRONTEND_DIR" && -f "$ROOT_DIR/package.json" ]]; then
  FRONTEND_DIR="$ROOT_DIR"
fi

PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

BACKEND_PID_FILE="$PID_DIR/music-catalog-core.pid"
FRONTEND_PID_FILE="$PID_DIR/soundloom-core.pid"

# Start backend first so frontend proxy has an upstream to call.
echo "▶️  Startar music-catalog-core (backend) på port 3001 ..."
( cd "$BACKEND_DIR" && npm run dev >"$LOG_DIR/music-catalog-core.log" 2>&1 ) &
echo $! > "$BACKEND_PID_FILE"

echo "⏳ Väntar 3 sekunder innan frontend startas ..."
sleep 3

echo "▶️  Startar soundloom-core (frontend) på port 3000 ..."
( cd "$FRONTEND_DIR" && npm run dev >"$LOG_DIR/soundloom-core.log" 2>&1 ) &
echo $! > "$FRONTEND_PID_FILE"

echo
echo "✅ Båda tjänsterna är startade"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Loggar:   $LOG_DIR"
