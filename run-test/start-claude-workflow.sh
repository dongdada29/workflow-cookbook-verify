#!/bin/bash
# 在 cmux terminal 中运行 Workflow 的脚本

# 使用 cmux send-panel 向 surface:24 发送命令
# 由于 send-panel 会把换行当作 Enter，所以需要小心处理

WORKSPACE="workspace:1"
SURFACE="surface:24"

echo "=== 开始执行 Workflow ==="

# 发送启动 Claude Code 的命令
echo "1. 启动 Claude Code with Workflow..."
cmux send-panel --panel "$SURFACE" --workspace "$WORKSPACE" "export CLAUDE_CODE_WORKFLOWS=1 && claude
" 2>&1

echo "等待 Claude Code 启动..."
sleep 15

# 检查 surface 列表
echo "2. 检查 Claude Code surface..."
cmux rpc surface.list 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
for s in data.get('surfaces', []):
    binding = s.get('resume_binding') or {}
    if binding.get('kind') == 'claude':
        print(f\"Found Claude Code surface: {s['ref']} - {s.get('title', '')}\")
" 2>/dev/null

echo "=== 完成 ==="
echo "请查看 cmux 应用中的 Claude Code 界面"