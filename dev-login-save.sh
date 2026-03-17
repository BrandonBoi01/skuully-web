#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-brandon@example.com}"
PASSWORD="${PASSWORD:-MySecret123}"
SCHOOL_ID="${SCHOOL_ID:-cmmi9ao700001s0a3sh4ozbv5}"
PROGRAM_ID="${PROGRAM_ID:-cmmi9ao9u0005s0a33u95ag4m}"

command -v curl >/dev/null || { echo "curl is required"; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required"; exit 1; }

json_get() {
  local key="$1"
  python3 - "$key" <<'PY'
import json, sys
key = sys.argv[1]
data = json.load(sys.stdin)
print(data.get(key, ""))
PY
}

LOGIN_JSON="$(curl -sS -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")")"

BASE_TOKEN="$(printf '%s' "$LOGIN_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
SCHOOL_JSON="$(curl -sS -X POST "$API_URL/schools/switch/$SCHOOL_ID" \
  -H "Authorization: Bearer $BASE_TOKEN")"
SCHOOL_TOKEN="$(printf '%s' "$SCHOOL_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROGRAM_JSON="$(curl -sS -X POST "$API_URL/programs/switch/$PROGRAM_ID" \
  -H "Authorization: Bearer $SCHOOL_TOKEN")"
FINAL_TOKEN="$(printf '%s' "$PROGRAM_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"

cat > ./set-token.js <<EOF
localStorage.setItem("token", "$FINAL_TOKEN");
console.log("Skuully token saved.");
EOF

echo "✅ Final token generated."
echo "📄 Browser snippet written to: ./set-token.js"
echo "Run this in browser console on http://localhost:3001 :"
echo
cat ./set-token.js