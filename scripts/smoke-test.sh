#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    printf "  ${GREEN}✓${NC} %s\n" "$desc"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}✗${NC} %s\n" "$desc"
    FAIL=$((FAIL + 1))
  fi
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "═══════════════════════════════════════════"
echo "  PersonalOS Smoke Test"
echo "═══════════════════════════════════════════"
echo ""

# ── 1: Surface health ──
echo "1. Surface Health Checks"

s1=$(curl -sf --max-time 5 http://localhost:3000/api/health 2>/dev/null | jq -r '.status // empty' || echo "")
check "Operator Console (3000)" "$([ "$s1" = "ok" ] && echo true || echo false)"

s2=$(curl -sf --max-time 5 http://localhost:3001/api/health 2>/dev/null | jq -r '.status // empty' || echo "")
check "Brand Portal (3001)" "$([ "$s2" = "ok" ] && echo true || echo false)"

s3=$(curl -sf --max-time 5 http://localhost:3002/api/health 2>/dev/null | jq -r '.status // empty' || echo "")
check "Soul App (3002)" "$([ "$s3" = "ok" ] && echo true || echo false)"

echo ""

# ── 2: Exchange engine ──
echo "2. Exchange Engine"

RESULT=$(cd "$PROJECT_DIR/operator-console" && npx tsx "$SCRIPT_DIR/smoke-exchange.ts" 2>/dev/null || echo '{"passed":false}')

check "Create listing" "$(echo "$RESULT" | jq -r '.listingCreated' 2>/dev/null || echo false)"
AL=$(echo "$RESULT" | jq -r '.activeListings' 2>/dev/null || echo 0)
check "Listing is active ($AL)" "$([ "$AL" -gt 0 ] && echo true || echo false)"
M=$(echo "$RESULT" | jq -r '.matches' 2>/dev/null || echo 0)
check "Exchange matches ($M)" "$([ "$M" -gt 0 ] && echo true || echo false)"
OC=$(echo "$RESULT" | jq -r '.offersCreated' 2>/dev/null || echo 0)
check "Offers created ($OC)" "$([ "$OC" -gt 0 ] && echo true || echo false)"
check "Claim settlement" "$(echo "$RESULT" | jq -r '.claimSuccess' 2>/dev/null || echo false)"
ST=$(echo "$RESULT" | jq -r '.settlements' 2>/dev/null || echo 0)
check "Settlement recorded ($ST)" "$([ "$ST" -gt 0 ] && echo true || echo false)"

echo ""

# ── 3: Scoring engine ──
echo "3. Brand Scoring Engine"

SR=$(cd "$PROJECT_DIR/operator-console" && npx tsx "$SCRIPT_DIR/smoke-scoring.ts" 2>/dev/null || echo '{"passed":false}')

CS=$(echo "$SR" | jq -r '.coldScore' 2>/dev/null || echo 0)
check "Cold start base score ($CS)" "$([ "$CS" = "75" ] && echo true || echo false)"
check "Cold start is new brand" "$(echo "$SR" | jq -r '.coldNew' 2>/dev/null || echo false)"
ES=$(echo "$SR" | jq -r '.estScore' 2>/dev/null || echo 0)
check "Established brand scored ($ES/100)" "$([ "$ES" -gt 0 ] && echo true || echo false)"
check "Established brand graduated" "$([ "$(echo "$SR" | jq -r '.estNew' 2>/dev/null)" = "false" ] && echo true || echo false)"
EC=$(echo "$SR" | jq -r '.estContextual' 2>/dev/null || echo 0)
check "Contextual score computed ($EC)" "$([ "$EC" -gt 0 ] && echo true || echo false)"

echo ""

# ── Summary ──
TOTAL=$((PASS + FAIL))
echo "═══════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  printf "  ${GREEN}All %d checks passed${NC}\n" "$TOTAL"
else
  printf "  ${GREEN}%d passed${NC}, ${RED}%d failed${NC} out of %d\n" "$PASS" "$FAIL" "$TOTAL"
fi
echo "═══════════════════════════════════════════"
echo ""

exit "$FAIL"
