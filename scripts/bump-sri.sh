#!/usr/bin/env bash
#
# bump-sri.sh — Refresh the pinned @spaceis/sdk CDN version and SHA-384
# integrity attribute in every HTML/PHP example that loads the UMD bundle
# from jsDelivr.
#
# Usage:
#   pnpm bump-sri <version>
#   ./scripts/bump-sri.sh <version>
#
# Example:
#   pnpm bump-sri 0.2.0
#
# Requirements: curl, openssl, sed (GNU or BSD). Works on macOS and Linux.
#
# Flow:
#   1. Poll jsDelivr (with retry) for @spaceis/sdk@<version>/dist/spaceis.global.js
#   2. Compute sha384 base64 of the served file
#   3. Rewrite the pinned version + integrity attribute in:
#        examples/vanilla/*.html
#        examples/php/includes/footer.php
#   4. Show diff; commit is manual (`git add examples/ && git commit`).

set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>   (e.g. $0 0.2.0)" >&2
  exit 1
fi

# Normalise — accept v0.2.0 or 0.2.0
VERSION="${VERSION#v}"

URL="https://cdn.jsdelivr.net/npm/@spaceis/sdk@${VERSION}/dist/spaceis.global.js"
TMP="$(mktemp -t spaceis-sdk.XXXXXX)"
trap 'rm -f "$TMP"' EXIT

echo "Fetching @spaceis/sdk@${VERSION} from jsDelivr..."

# Poll — jsDelivr mirrors from npm lazily (usually 1–5 min after publish)
for i in {1..20}; do
  if curl -sfL --max-time 15 "$URL" -o "$TMP"; then
    echo "  ready on attempt $i"
    break
  fi
  echo "  not ready (attempt $i/20), sleeping 30s..."
  sleep 30
  if [[ "$i" == "20" ]]; then
    echo "ERROR: jsDelivr did not serve @spaceis/sdk@${VERSION} within 10 minutes." >&2
    echo "Retry later — the npm → jsDelivr sync can take up to 12 hours in rare cases." >&2
    exit 1
  fi
done

# Compute SHA-384 (base64) — this is the SRI integrity format
HASH="sha384-$(openssl dgst -sha384 -binary "$TMP" | openssl base64 -A)"
echo "Integrity: ${HASH}"

# Resolve target files. `ls` errors if globs don't match; collect into an array first.
shopt -s nullglob
FILES=(examples/vanilla/*.html examples/php/includes/footer.php)
shopt -u nullglob

if [[ "${#FILES[@]}" -eq 0 ]]; then
  echo "ERROR: no target files found." >&2
  exit 1
fi

# sed -i syntax differs between GNU and BSD (macOS). Detect and dispatch.
if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(sed -i -E)
else
  # BSD/macOS sed requires a backup suffix after -i; empty string = no backup
  SED_INPLACE=(sed -i '' -E)
fi

echo "Rewriting ${#FILES[@]} files..."

# 1) Pinned version — any prior X.Y.Z → VERSION
"${SED_INPLACE[@]}" \
  "s|@spaceis/sdk@[0-9]+\.[0-9]+\.[0-9]+/dist/spaceis\.global\.js|@spaceis/sdk@${VERSION}/dist/spaceis.global.js|g" \
  "${FILES[@]}"

# 2) integrity attribute — ONLY on the line that pins @spaceis/sdk@VERSION.
# Address-scoped substitution prevents clobbering other SRI hashes in the file
# (DOMPurify, etc.). `\|ADDR|` is POSIX alternative-delimiter syntax and
# works on both GNU and BSD sed.
"${SED_INPLACE[@]}" \
  "\\|@spaceis/sdk@${VERSION}/dist/spaceis\\.global\\.js| s|integrity=\"sha384-[A-Za-z0-9+/=]+\"|integrity=\"${HASH}\"|" \
  "${FILES[@]}"

echo
echo "Done. Changed files (git diff --stat):"
git diff --stat examples/ || true
echo
echo "Next steps:"
echo "  git diff examples/           # review the diff"
echo "  git add examples/"
echo "  git commit -m \"chore: bump CDN SRI hashes to @spaceis/sdk@${VERSION}\""
echo "  git push"
