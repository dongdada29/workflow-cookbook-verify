#!/usr/bin/env bash

set -euo pipefail

echo "🔍 Validating workflow scripts..."

WORKFLOW_DIR="workflows"
ERRORS=0

for file in "$WORKFLOW_DIR"/*.js; do
  filename=$(basename "$file")
  echo "  Checking $filename"
  
  # 1. Syntax check
  if ! node --check "$file" 2>&1; then
    echo "    ❌ Syntax error"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  
  # 2. Check for required exports
  if ! grep -q "export const meta" "$file"; then
    echo "    ❌ Missing 'export const meta'"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  
  # 3. Check for phase() calls
  if ! grep -q "phase(" "$file"; then
    echo "    ⚠️  No phase() calls found"
  fi
  
  # 4. Check for agent() calls
  if ! grep -q "agent(" "$file"; then
    echo "    ⚠️  No agent() calls found"
  fi
  
  # 5. Check for return statement
  if ! grep -q "return " "$file"; then
    echo "    ⚠️  No return statement found"
  fi
  
  # 6. Check for null checks after agent() calls
  if grep -q "await agent(" "$file" && ! grep -q "filter(Boolean)" "$file" && ! grep -q "if (!.*) {" "$file"; then
    echo "    ⚠️  agent() calls without null checks"
  fi
  
  echo "    ✅ OK"
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All workflow scripts validated successfully!"
  exit 0
else
  echo "❌ Found $ERRORS error(s)"
  exit 1
fi