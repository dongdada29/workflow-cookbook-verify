# Workflow 执行指南

## 当前环境状态

✅ Claude Code v2.1.156 已安装
✅ `CLAUDE_CODE_WORKFLOWS=1` 已配置
✅ cmux 已安装并可访问
❌ CLI 直接执行 Workflow 有问题（API 格式问题）

## 执行方式

### 方式 1：手动在 cmux 中执行（推荐）

1. 打开 cmux 应用
2. 切换到 workspace:1 中的 Claude Code surface（surface:3，「✳ 局域网多平台电脑Agent控制方案」）
3. 发送以下命令：

```
/env | grep CLAUDE_CODE_WORKFLOWS
```

确认显示 `CLAUDE_CODE_WORKFLOWS=1`

4. 然后发送 Workflow 脚本内容

### 方式 2：通过 cmux send-panel 发送

```bash
# 向 surface:24 发送命令启动 Claude Code
cmux send-panel --panel surface:24 --workspace workspace:1 "export CLAUDE_CODE_WORKFLOWS=1 && claude
"
```

等待 Claude Code 启动，然后发送 Workflow 脚本。

## 可用的 Claude Code Surface

| Surface | Title | Kind |
|---------|-------|------|
| surface:3 | ✳ 局域网多平台电脑Agent控制方案 | claude |
| surface:24 | π - workspace | terminal |
| surface:23 | hermes | terminal |

## 发送 Workflow 脚本

使用 `workflow-executor.sh`:

```bash
cd /Users/apple/workspace/workflow-cookbook-verify/run-test
./workflow-executor.sh surface:3 hello.js
```

## 查看结果

在 cmux 应用中查看 Claude Code surface 的输出。

## 当前状态

Workflow 功能已配置，但需要通过 Claude Code 内置的 `/workflow` 命令执行。
Claude Code CLI 在非交互模式下有 API 格式问题，需要通过 UI 界面执行。