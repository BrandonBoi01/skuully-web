#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"

FULL_NAME="Brandon Boi"
EMAIL="brandon@example.com"
PASSWORD="MySecret123"
SCHOOL_NAME="Skuully Demo School"
COUNTRY="Kenya"

echo "==> Checking API..."
curl -s "$BASE_URL/status" >/dev/null || {
  echo "API is not reachable at $BASE_URL"
  exit 1
}

echo "==> Registering owner account..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\":\"$FULL_NAME\",
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\",
    \"schoolName\":\"$SCHOOL_NAME\",
    \"country\":\"$COUNTRY\"
  }")

echo "$REGISTER_RESPONSE"

USER_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["token"])')
SCHOOL_ID=$(echo "$REGISTER_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["school"]["id"])')
PROGRAM_ID=$(echo "$REGISTER_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["program"]["id"])')

echo "==> Switching school..."
SCHOOL_SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/schools/switch/$SCHOOL_ID" \
  -H "Authorization: Bearer $USER_TOKEN")

echo "$SCHOOL_SWITCH_RESPONSE"

SCHOOL_TOKEN=$(echo "$SCHOOL_SWITCH_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["token"])')

echo "==> Switching program..."
PROGRAM_SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/programs/switch/$PROGRAM_ID" \
  -H "Authorization: Bearer $SCHOOL_TOKEN")

echo "$PROGRAM_SWITCH_RESPONSE"

PROGRAM_TOKEN=$(echo "$PROGRAM_SWITCH_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["token"])')

echo "==> Seeding program..."
curl -s -X POST "$BASE_URL/schools/programs/$PROGRAM_ID/seed" \
  -H "Authorization: Bearer $SCHOOL_TOKEN"
echo

echo "==> Generating classes..."
curl -s -X POST "$BASE_URL/schools/programs/$PROGRAM_ID/generate-classes" \
  -H "Authorization: Bearer $SCHOOL_TOKEN"
echo

echo "==> Loading classes..."
CLASSES_RESPONSE=$(curl -s "$BASE_URL/programs/classes" \
  -H "Authorization: Bearer $PROGRAM_TOKEN")

echo "$CLASSES_RESPONSE"

CLASS_ID=$(echo "$CLASSES_RESPONSE" | python3 -c 'import sys, json; data=json.load(sys.stdin); print(data[0]["id"] if data else "")')

if [ -z "$CLASS_ID" ]; then
  echo "No class was generated."
  exit 1
fi

echo "==> Using CLASS_ID=$CLASS_ID"

create_student() {
  local full_name="$1"
  local admission_no="$2"
  local gender="$3"

  curl -s -X POST "$BASE_URL/students" \
    -H "Authorization: Bearer $PROGRAM_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"fullName\":\"$full_name\",
      \"admissionNo\":\"$admission_no\",
      \"gender\":\"$gender\",
      \"classId\":\"$CLASS_ID\"
    }"
}

echo "==> Creating students..."
STUDENT1=$(create_student "Brian Ouma" "ADM001" "Male")
STUDENT2=$(create_student "Lydia Akinyi" "ADM002" "Female")
STUDENT3=$(create_student "Mark Kiptoo" "ADM003" "Male")

echo "$STUDENT1"
echo "$STUDENT2"
echo "$STUDENT3"

STUDENT_ID_1=$(echo "$STUDENT1" | python3 -c 'import sys, json; print(json.load(sys.stdin)["student"]["id"])')
STUDENT_ID_2=$(echo "$STUDENT2" | python3 -c 'import sys, json; print(json.load(sys.stdin)["student"]["id"])')
STUDENT_ID_3=$(echo "$STUDENT3" | python3 -c 'import sys, json; print(json.load(sys.stdin)["student"]["id"])')

TODAY=$(date +%F)

echo "==> Creating attendance session for $TODAY..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/attendance/sessions" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"classId\":\"$CLASS_ID\",
    \"date\":\"$TODAY\",
    \"periodName\":\"Morning Rollcall\"
  }")

echo "$SESSION_RESPONSE"

SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["session"]["id"])')

echo "==> Marking attendance..."
MARK_RESPONSE=$(curl -s -X POST "$BASE_URL/attendance/sessions/$SESSION_ID/mark" \
  -H "Authorization: Bearer $PROGRAM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"marks\": [
      {\"studentId\":\"$STUDENT_ID_1\", \"status\":\"PRESENT\"},
      {\"studentId\":\"$STUDENT_ID_2\", \"status\":\"LATE\"},
      {\"studentId\":\"$STUDENT_ID_3\", \"status\":\"ABSENT\"}
    ]
  }")

echo "$MARK_RESPONSE"

echo "==> Testing control center..."
CONTROL_CENTER=$(curl -s "$BASE_URL/dashboard/control-center" \
  -H "Authorization: Bearer $PROGRAM_TOKEN")

echo "$CONTROL_CENTER"

echo
echo "=============================================="
echo "DONE"
echo "Program token for frontend:"
echo "$PROGRAM_TOKEN"
echo
echo "Set it in browser console:"
echo "localStorage.setItem(\"token\", \"$PROGRAM_TOKEN\")"
echo "=============================================="