# 01-hello-workflow.js 配方说明

## 章节出处

第 04 章 · 第一个 Workflow

## 配方动机

这是最简单的工作流示例，用于验证：
1. Workflow 运行时是否正常开启
2. 单个 subagent 能否正常执行
3. schema 约束的结构化输出是否生效

## 核心模式

```
agent() + schema 强制结构化输出
```

## 真实运行数据

| 指标 | 值 |
|------|-----|
| Run ID | `wf_dacbd480-d5d` |
| agent_count | 1 |
| total_tokens | 26,338 |
| duration_ms | 5,506 |
| sum 类型 | number (不是 string) |

## 关键观察

1. **schema 强制类型**：返回的 `sum` 是数字 `4`，不是字符串 `"4"`
2. **异步回执**：Workflow 启动立即返回 taskId/runId，结果在完成通知里
3. **运行方式**：这是 Workflow 脚本，不是 Node.js 脚本，不能用 `node` 直接执行

## 运行方式

```javascript
// 在 Claude Code 中（需开启 CLAUDE_CODE_WORKFLOWS=1）
// 让 Claude 执行这个脚本内容
```

## 相关章节

- 第 07 章：结构化输出与 Schema（深入理解 schema 校验机制）
- 第 06 章：agent() 完全指南