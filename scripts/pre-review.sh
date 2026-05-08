#!/usr/bin/env bash
# Automated structural checks before any reviewer agent runs.
# Bans hardcoded design tokens and enforces import discipline in feature/app code.
# shared/ui/ is intentionally excluded — those are shadcn primitives we trust.
#
# Run: pnpm design:pre-review
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Scope: directories where we author markup. shared/ui/ is shadcn (frozen) and excluded.
SCAN_PATHS=(app features shared/lib shared/hooks shared/types shared/constants)
EXISTING_PATHS=()
for p in "${SCAN_PATHS[@]}"; do
  [ -e "$p" ] && EXISTING_PATHS+=("$p")
done

if [ ${#EXISTING_PATHS[@]} -eq 0 ]; then
  echo "PASS: no scan paths exist yet (nothing to check)"
  exit 0
fi

fail=0
report() {
  echo ""
  echo "❌ FAIL: $1"
  echo "$2"
  fail=1
}

# 0. Refresh inventory (cheap, deterministic)
node scripts/generate-inventory.mjs

# 1. Hex colors — globals.css is the single source of truth
HEX=$(grep -rEn '#[0-9a-fA-F]{3,8}\b' "${EXISTING_PATHS[@]}" \
  --include='*.tsx' --include='*.ts' --include='*.css' \
  --exclude='globals.css' 2>/dev/null || true)
[ -n "$HEX" ] && report "hex colors found (use CSS variables from globals.css)" "$HEX"

# 2. rgb / rgba literals
RGB=$(grep -rEn '\brgba?\(' "${EXISTING_PATHS[@]}" \
  --include='*.tsx' --include='*.ts' 2>/dev/null || true)
[ -n "$RGB" ] && report "rgb/rgba literals found (use CSS variables)" "$RGB"

# 3. Arbitrary Tailwind values (bg-[...], text-[...], p-[...], etc.)
ARB=$(grep -rEn '\b(bg|text|p|m|w|h|gap|rounded|border|ring|shadow|space)-\[' "${EXISTING_PATHS[@]}" \
  --include='*.tsx' 2>/dev/null || true)
[ -n "$ARB" ] && report "arbitrary Tailwind values found (use design tokens / standard scale)" "$ARB"

# 4. Inline style attribute
INLINE=$(grep -rEn 'style=\{\{' "${EXISTING_PATHS[@]}" \
  --include='*.tsx' 2>/dev/null || true)
[ -n "$INLINE" ] && report "inline style attribute found (use Tailwind classes)" "$INLINE"

# 5. @radix-ui import (we use @base-ui/react)
RADIX=$(grep -rEn "from ['\"]@radix-ui" "${EXISTING_PATHS[@]}" \
  --include='*.tsx' --include='*.ts' 2>/dev/null || true)
[ -n "$RADIX" ] && report "@radix-ui import found (project uses @base-ui/react)" "$RADIX"

# 6. interface declarations outside __tests__ (CLAUDE.md: types come from Zod only)
IFACE=$(grep -rEn '^[[:space:]]*(export[[:space:]]+)?interface[[:space:]]' "${EXISTING_PATHS[@]}" \
  --include='*.tsx' --include='*.ts' 2>/dev/null || true)
[ -n "$IFACE" ] && report "interface declaration found outside tests (use Zod schemas)" "$IFACE"

if [ $fail -ne 0 ]; then
  echo ""
  echo "Pre-review failed. Fix the issues above, then re-run."
  exit 1
fi

echo ""
echo "✓ token / import / type discipline checks passed"

# 7. Type / lint / test (full suite)
echo ""
echo "→ pnpm type-check"
pnpm type-check
echo ""
echo "→ pnpm lint"
pnpm lint
echo ""
echo "→ pnpm test"
pnpm test

echo ""
echo "✅ PASS: pre-review"
