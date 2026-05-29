#!/bin/bash
# workflow-executor.sh
# 通过 cmux 向 Claude Code surface 发送 Workflow 脚本
# 
# 使用方式: ./workflow-executor.sh <workspace> <surface> <script_file>

WORKSPACE="${1:-workspace:1}"
SURFACE="${2:-surface:3}"
SCRIPT_FILE="${3:-}"

if [ -z "$SCRIPT_FILE" ]; then
  echo "用法: $0 <workspace> <surface> <script_file>"
  echo "示例: $0 surface:3 hello.js"
  exit 1
fi

# 读取脚本内容
SCRIPT=$(cat "$SCRIPT_FILE")

# 发送脚本内容
echo "发送 Workflow 脚本到 $WORKSPACE / $SURFACE..."
cmux send-panel --panel "$SURFACE" --workspace "$WORKSPACE" "Execute this Workflow script:

$SCRIPT" 2>&1

echo "脚本已发送，请在 Claude Code 界面中查看结果"