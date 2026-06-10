#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "  Backend  → http://localhost:8000"
echo "  API docs → http://localhost:8000/docs"
echo "  Frontend → http://localhost:5173"
echo ""

docker compose up --build
