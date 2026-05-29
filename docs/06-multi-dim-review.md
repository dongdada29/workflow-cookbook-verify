# 06-multi-dim-review.js 配方说明

## 章节出处

第 11 章 · PR 多维 Review

## 配方动机

解决「同一份代码，多个维度」的问题：
- 安全、性能、可访问性需要不同的专业视角
- 每个 agent 只盯一个维度，注意力集中
- 自然可以并发（各维度互不依赖）

## 真实运行数据

| 指标 | 值 |
|------|-----|
| Run ID | `wf_4c5caabb-b73` |
| agent_count | 4 (3 评审 + 1 综合) |
| total_tokens | 221,648 |
| duration_ms | 272,643 (~4.5 分钟) |
| 原始发现 | 26 条 |
| 综合结果 | 16 个问题 |

三个维度产出：
- a11y: 10 条
- perf: 6 条
- correct: 10 条

Top 5 上线阻断项：DOM XSS、无焦点指示、重复 heading ID、异步竞态、橙对比度不足

## 核心代码模式

```javascript
// 三维并发评审：parallel 屏障
const reviews = await parallel(
  DIMS.map((d) => () =>
    agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA })
      .then((r) => ({ dim: d.key, findings: (r && r.findings) || [] }))
  )
)

// 屏障释放后：扁平化 + 打标签
const all = reviews.filter(Boolean).flatMap((r) => 
  r.findings.map((f) => ({ ...f, dim: r.dim }))
)

// 综合 agent 看到全部发现
const summary = await agent(
  `These are ${all.length} findings... Dedup, rank by severity, mark blockers.`,
  { label: 'synthesize', phase: 'Synthesize', schema: SUMMARY_SCHEMA }
)
```

## 为什么用 parallel（屏障）而不是 pipeline

因为 synthesize 需要**全部**维度的发现才能做全局去重和排序。
- 这正是第 08 章「正确使用屏障」的真实形态

## 关键设计

1. **统一 schema**：三个维度产出同构的 `{severity, title, detail, fix}`
2. **打维度标签**：每条发现带 `dim`，综合结果带 `dims` 数组
3. **综合 agent 看全部**：全局去重和排序

## 可替换的维度

| 评审场景 | 建议维度 |
|---------|---------|
| 后端 PR | 安全、并发、错误处理、API 契约 |
| 前端 PR | 可访问性、性能、正确性/安全 |
| 数据管道 | 正确性、幂等性、可观测性、成本 |
| 文档 PR | 准确性、完整性、一致性、可读性 |

## 变体

- **变体 A**：Review → Verify → Synthesize（加对抗验证阶段）
- **变体 B**：多文件 PR（pipeline 套 parallel）
- **变体 C**：维度加权计分（做 CI 门禁）
- **变体 D**：评审 + 自动修复（串 GCF）

## 相关章节

- 第 11 章：PR 多维 Review 完整讲解
- 第 10 章：分片审查（按文件/目录切）
- 第 17 章：对抗验证（加 Verify 阶段）