#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$ROOT_DIR/.pids"

stop_service() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "ℹ️  Ingen PID-fil för $name ($pid_file)."
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -z "$pid" ]]; then
    echo "⚠️  Tom PID i $pid_file, tar bort filen."
    rm -f "$pid_file"
    return 0
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "🛑 Stoppar $name (PID $pid) ..."
    kill "$pid"
  else
    echo "ℹ️  $name (PID $pid) kör inte längre."
  fi

  rm -f "$pid_file"
}

stop_service "soundloom-core" "$PID_DIR/soundloom-core.pid"
stop_service "music-catalog-core" "$PID_DIR/music-catalog-core.pid"

echo "✅ Stoppscript klart."
