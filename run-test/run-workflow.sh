#!/bin/bash
# run-workflow.sh
# 在 Claude Code 中运行 Workflow 脚本的辅助脚本
# 
# 这个脚本会创建一个可以复制粘贴到 Claude Code 的命令

SCRIPT="${1:-}"

if [ -z "$SCRIPT" ]; then
  echo "用法: ./run-workflow.sh <workflow-file.js>"
  echo ""
  echo "示例: ./run-workflow.sh hello.js"
  exit 1
fi

if [ ! -f "$SCRIPT" ]; then
  echo "错误: 文件不存在: $SCRIPT"
  exit 1
fi

echo "=========================================="
echo "复制以下内容到 Claude Code 中执行:"
echo "=========================================="
echo ""
echo "/workflow run $(cat "$SCRIPT")"
echo ""
echo "=========================================="
echo ""

# 或者尝试直接执行
export CLAUDE_CODE_WORKFLOWS=1
echo "尝试直接执行..."
claude -p "执行这个 Workflow 脚本:\n\n$(cat "$SCRIPT")" 2>&1 || true