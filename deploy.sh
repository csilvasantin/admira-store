#!/usr/bin/env bash
# Publica admira.store en CLOUDFLARE PAGES (proyecto 'admira-store').
# Desde la unificación 2026-07-11 el ORIGEN de producción es Cloudflare Pages
# (custom domain www.admira.store). git push queda como backup de código.
# Uso: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
# EL SELLO Y LA FIRMA, GENERADOS AQUÍ (Morfeo, 2026-08-09). El Webmaster daba SIN
# FIRMA a admira.store: index.html declaraba v.05.08.2026.r1.14:09 y version.json
# seguía firmando la v.04.08.2026.r1.11:18. No era descuido de nadie en concreto —era
# que este deploy NO tocaba version.json, así que había que acordarse de actualizarlo
# a mano cada vez, y el día que no te acuerdas la release deja de ser verificable.
# Ahora se deriva del <meta> canónico, que es el sello, y se firma con quien publica.
echo "→ Sello y firma…"
: "${ADMIRA_RELEASE_AGENT:?Define ADMIRA_RELEASE_AGENT (ej. MorfeoMBA16)}"
: "${ADMIRA_RELEASE_MACHINE:?Define ADMIRA_RELEASE_MACHINE (ej. MacBookAir16plata)}"
SELLO="$(sed -n 's/.*admiranext-version[^>]*content="[^"]*\(v\.[^"]*\)".*/\1/p' index.html | head -1)"
[ -n "$SELLO" ] || { echo "  ✖ index.html no declara sello canónico (norma 07)"; exit 1; }
GIT="$(git rev-parse HEAD)"
# GitHub Pages valida release-signature.json antes de construir. El espejo trae
# la firma del origen XpaceOS, pero admira.store necesita la de esta publicación.
# Regenerarla aquí evita que Pages rechace todas las releases por una versión o
# una identidad heredadas del repositorio fuente.
jq -n --arg v "$SELLO" --arg a "$ADMIRA_RELEASE_AGENT" --arg m "$ADMIRA_RELEASE_MACHINE" \
      '{version:$v,deployer:$a,machine:$m,signature:($a+" · "+$m)}' \
      > release-signature.json
jq -n --arg v "$SELLO" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --arg a "$ADMIRA_RELEASE_AGENT" --arg m "$ADMIRA_RELEASE_MACHINE" \
      --arg g "$GIT" --arg gs "${GIT:0:7}" \
      '{version:$v,deployedAt:$t,deployer:$a,machine:$m,signature:($a+" · "+$m),git:$g,gitShort:$gs,gitFull:$g,dirty:false}' \
      > version.json
git add release-signature.json version.json && git commit -q -m "sello $SELLO · $ADMIRA_RELEASE_AGENT · $ADMIRA_RELEASE_MACHINE" || true
echo "  ✓ $SELLO · $ADMIRA_RELEASE_AGENT · $ADMIRA_RELEASE_MACHINE"

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
