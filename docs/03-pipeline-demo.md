# 03-pipeline-demo.js 配方说明

## 章节出处

第 08 章 · parallel 屏障 vs pipeline 流水线

## 配方动机

演示 `pipeline()` 的核心特性：
1. **无屏障流水线**：每个 item 各走各的，阶段间没有同步点
2. **阶段回调签名**：`callback(prevResult, originalItem, index)`
3. **墙钟优势**：墙钟 ≈ 最慢的单条链，而不是各阶段之和

## 真实运行数据

| 指标 | 值 |
|------|-----|
| Run ID | `wf_bf086b98-6ec` |
| agent_count | 6 (= 3 items × 2 stages) |
| total_tokens | 158,982 |
| duration_ms | 26,743 |

## 核心代码模式

```javascript
const items = ['off-by-one', 'null-dereference', 'race-condition']
const out = await pipeline(
  items,
  // 第一阶段：(item, item, index) - prevResult 就是 item 自己
  (kind) =>
    agent(`Give a one-line code example of a ${kind} bug.`, {
      label: `find:${kind}`, phase: 'Find',
      schema: FINDING_SCHEMA,
    }),
  // 第二阶段：(prevResult, originalItem, index) - prevResult 是上阶段返回值
  (found, kind) =>
    agent(`Is this genuinely a ${kind} bug? Example: "${found.example}".`, {
      label: `verify:${kind}`, phase: 'Verify',
      schema: VERDICT_SCHEMA,
    }).then((v) => ({ kind, ...found, ...v }))
)
```

## parallel vs pipeline 对比

| 特性 | parallel() | pipeline() |
|------|------------|------------|
| 语义 | 屏障 | 无屏障流水线 |
| 阶段间 | 等全部完成 | 每个 item 独立推进 |
| 墙钟 | 各阶段最慢之和 | 最慢的单条链 |
| 结果 | 数组 | 数组（每项是完整记录） |

## 官方判据

> **多阶段任务默认用 `pipeline()`。** 只有当「第 N 阶段需要前一阶段**全部** item 的结果」时，才用屏障（`parallel`）。

## 什么时候用 pipeline

- 每个 item 可独立地一路流到底
- 阶段间不需要等待其他 item

## 相关章节

- 第 08 章：parallel vs pipeline 完整对比
- 第 10 章：分片审查（pipeline 套 parallel 的典型组合）