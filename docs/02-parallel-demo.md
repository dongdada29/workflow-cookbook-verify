# 02-parallel-demo.js 配方说明

## 章节出处

第 08 章 · parallel 屏障 vs pipeline 流水线

## 配方动机

演示 `parallel()` 的核心特性：
1. **屏障语义**：等全部 3 个 agent 完成，才返回结果数组
2. **真并发**：3 个 agent 同时跑，不是串行
3. **结果顺序**：返回数组顺序与输入顺序一致

## 真实运行数据

| 指标 | 值 |
|------|-----|
| Run ID | `wf_52957913-6d2` |
| agent_count | 3 |
| total_tokens | 78,844 |
| duration_ms | 8,395 |
| 每 agent 约 | 26.3K token |

对比单 agent 基线（hello）：约 5.5s / 26K token
3 个并发只花了 8.4s，远小于 3 × 5.5 = 16.5s（证明真并发）

## 核心代码模式

```javascript
const dims = ['naming', 'error-handling', 'comments']
const results = await parallel(
  dims.map((d, i) => () =>
    agent(`Name one common ${d} code smell...`, {
      label: `smell:${d}`,
      schema: { type: 'object', properties: { smell: { type: 'string' } }, required: ['smell'] },
    })
  )
)
```

**关键点**：`parallel()` 接收的是 **thunk 数组** `() => agent(...)`，不是 Promise 数组！

## 常见错误

```javascript
// ✗ 错：传 Promise 数组（agent() 会立刻执行）
await parallel(dims.map(d => agent(...)))

// ✓ 对：传 thunk 数组（() => agent(...)）
await parallel(dims.map(d => () => agent(...)))
```

## 什么时候用 parallel

- 一组独立任务，需要**全部结果**一起拿来用
- 下一阶段需要**所有**上一阶段的结果（如去重、综合）

## 相关章节

- 第 08 章：parallel vs pipeline 完整对比
- 第 11 章：PR 多维 Review（parallel 屏障的教科书场景）