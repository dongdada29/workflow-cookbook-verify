#!/bin/bash
# validate-workflows.sh
# 验证 Workflow 脚本语法（不是执行，只是语法检查）
# 
# 注意：Workflow 脚本不能在普通 Node.js 下运行
# 这里只是验证基本的 JavaScript 语法
# 真正的运行需要 Claude Code + CLAUDE_CODE_WORKFLOWS=1

set -e

echo "=== Workflow Cookbook 脚本验证 ==="
echo ""
echo "注意：这些是 Workflow 脚本，需要 Claude Code 执行"
echo "这里只做基本的 JavaScript 语法检查"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOW_DIR="$SCRIPT_DIR/../workflows"
cd "$WORKFLOW_DIR"

FAILED=0
for f in *.js; do
  echo -n "检查 $f ... "
  # Workflow 脚本使用 ES modules (export)，Node.js 可以直接检查语法
  if node --check "$f" 2>&1; then
    echo "✓ 语法正确"
  else
    echo "✗ 语法错误"
    FAILED=1
  fi
done

echo ""
if [ $FAILED -eq 0 ]; then
  echo "所有脚本语法检查通过 ✓"
else
  echo "部分脚本有语法错误"
  exit 1
fi