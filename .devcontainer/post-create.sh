#!/usr/bin/env bash
set -euo pipefail

npm ci || npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "=============================================================="
  echo "  .env created from .env.example with PLACEHOLDER values."
  echo "  The app runs but accounts are DISABLED until you add your"
  echo "  Supabase URL + anon key (supabase.com → Settings → API)."
  echo "=============================================================="
  echo ""
fi
