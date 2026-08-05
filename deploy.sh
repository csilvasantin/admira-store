#!/usr/bin/env bash
# Publica admira.store en CLOUDFLARE PAGES (proyecto 'admira-store').
# Desde la unificación 2026-07-11 el ORIGEN de producción es Cloudflare Pages
# (custom domain www.admira.store). git push queda como backup de código.
# Uso: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
echo "→ GitHub (push de código, backup)…"
# PRODUCCION ES LA RAMA PRINCIPAL. El 5-ago-2026 yokup.com estuvo horas
# sirviendo una rama de trabajo y nadie se entero. Este guarda lo impide:
# aborta si lo que tienes delante no es exactamente origin/main.
echo "→ Rama…"
source ~/Claude/admira-vault/guarda-rama.sh

git push origin main 2>&1 | tail -1 || echo "  (nada que pushear)"
echo "→ Cloudflare Pages (ORIGEN de producción)…"
export CLOUDFLARE_API_TOKEN="$(bash ~/Claude/admira-vault/vault-get.sh CLOUDFLARE_API_TOKEN)"
TMP="$(mktemp -d)"; git archive main | tar -x -C "$TMP"
npx --yes wrangler@latest pages deploy "$TMP" --project-name admira-store --branch main
rm -rf "$TMP"
echo "✓ https://www.admira.store (Cloudflare Pages) · mirror https://admira-store.pages.dev"
