#!/bin/bash
# 尝试在 cmux 中运行 Claude Code Workflow
# 这个脚本通过 cmux 命令向终端发送命令

WORKSPACE="workspace:10"
SURFACE="surface:26"

echo "=== 通过 cmux 执行 Workflow ==="
echo ""

# 1. 发送命令启动 Claude Code
echo "1. 启动 Claude Code..."
cmux send --workspace "$WORKSPACE" --surface "$SURFACE" "CLAUDE_CODE_WORKFLOWS=1 claude" 2>&1

sleep 2

# 2. 发送 Workflow 脚本内容
echo "2. 发送 Workflow 脚本..."

# 读取脚本内容并发送
SCRIPT=$(cat hello.js)

# 通过多行发送（cmux send 可能需要处理换行）
cmux send --workspace "$WORKSPACE" --surface "$SURFACE" "请执行以下 Workflow 脚本:" 2>&1

# 发送脚本内容（分块）
cmux send --workspace "$WORKSPACE" --surface "$SURFACE" "export const meta = {
  name: 'hello-workflow',
  description: 'Smoke test: one subagent returns schema-constrained structured output',
  phases: [{ title: 'Greet', detail: 'One subagent confirms the runtime' }],
}

phase('Greet')
const r = await agent(
  'You are a smoke test for the Claude Code Workflow runtime. Return a one-sentence ' +
  'confirmation message, the integer value of 2+2, and a boolean confirming you ran ' +
  'as a workflow subagent.',
  {
    label: 'smoke',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sum: { type: 'number' },
        runtimeConfirmed: { type: 'boolean' },
      },
      required: ['message', 'sum', 'runtimeConfirmed'],
    },
  }
)
log('smoke result: ' + JSON.stringify(r))
return r" 2>&1

echo ""
echo "=== 脚本已发送 ==="
echo "请在 cmux 的 Workflow Test workspace 中查看 Claude Code 的响应"