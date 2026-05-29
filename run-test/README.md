# 在 cmux 中运行 Claude Code Workflow

## 当前状态

Claude Code 已通过 `CLAUDE_CODE_WORKFLOWS=1` 开启 Workflow 功能。
但 CLI 参数传递遇到了一些问题。

## 方法 1：通过 cmux 执行命令

你可以直接在 cmux 终端中执行：

```
/exec CLAUDE_CODE_WORKFLOWS=1 claude -p "执行这个 Workflow：..." 
```

或者启动一个新的 Claude Code 会话来运行 Workflow。

## 方法 2：手动复制粘贴

1. 打开 cmux
2. 新建一个 terminal tab
3. 设置环境变量：`export CLAUDE_CODE_WORKFLOWS=1`
4. 启动 Claude Code：`claude`（不带参数，进入交互模式）
5. 在 Claude Code 对话中发送 Workflow 脚本内容

## 方法 3：使用 tmux/cell 方式

```bash
# 在 cmux terminal 中
export CLAUDE_CODE_WORKFLOWS=1
claude
```

然后在 Claude Code 会话中粘贴脚本内容。

## 检查 Workflow 是否可用

在 Claude Code 中执行：
```
/env | grep CLAUDE_CODE_WORKFLOWS
```

应该显示：`CLAUDE_CODE_WORKFLOWS=1`

## Workflow 脚本位置

```
/Users/apple/workspace/workflow-cookbook-verify/run-test/hello.js
```

## 需要帮助？

尝试在 Claude Code 中直接执行 Workflow 脚本，看是否有 Workflow 工具可用。