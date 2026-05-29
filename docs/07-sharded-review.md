# 07-sharded-review.js 配方说明

## 章节出处

第 10 章 · 分片代码审查

## 配方动机

解决「大代码库塞不进单个 agent 上下文」的问题：
- 把大目标切成小分片，每片派一个 agent 独立审
- 每片有独立上下文，注意力集中
- 原始代码不回流主循环，只返回结构化发现

## 核心模式

四段式：`Scan → Review → Verify → Synthesize`

```
Scan: 发现分片（文件/模块列表）
Review: 每片一个 agent 审查
Verify: 对抗验证（每条发现一个验证 agent）
Synthesize: 跨片去重排序（需要全局视图，用屏障）
```

## 核心代码模式

```javascript
// Review→Verify 用 pipeline：每片审完立刻验，不必等别片
const reviewed = await pipeline(
  shards,
  // 第一阶段：Review
  (shard) => agent(`Review ${shard}...`, { label: `review:${shard}`, phase: 'Review', schema: FINDING }),
  // 第二阶段：Verify（该片每条发现一个验证 agent）
  (review, shard) => {
    if (!review) return []
    return parallel(review.findings.map(f => () =>
      agent(`Adversarially verify: "${f.title}"`, { label: `verify:${shard}`, phase: 'Verify', schema: VERDICT })
        .then(v => ({ ...f, shard, real: v && v.real }))
    )).then(rs => rs.filter(Boolean).filter(x => x.real))
  }
)

// Synthesize 前才用屏障（需要跨片全局视图）
const all = reviewed.flat().filter(Boolean)
const report = await agent(`Dedup and prioritize ${all.length} findings...`, {...})
```

## parallel vs pipeline 在分片审查中的应用

| 阶段间 | 用什么 | 为什么 |
|--------|--------|--------|
| Review → Verify | **pipeline** | 每片审完立刻验，不用等别片 |
| 各片内部的 Verify | **parallel** | 该片的多条发现并发验证，需要等全部结果（内层屏障是正确的） |
| Synthesize 前 | **parallel 屏障** | 需要跨片全局视图去重排序 |

## 成本估算

```
agent 总数 = 1 (Scan)
           + N (Review)
           + Σ(每片发现数) (Verify)
           + 1 (Synthesize)
```

经验法则：
- token ≈ agent 数 × 2.7 万
- 墙钟 ≈ 最慢的那条单链（pipeline 无屏障）

## 分片粒度

| 切法 | 一片 = | 适合 |
|------|--------|------|
| 按文件 | 单个源文件 | 改动分散在多文件 |
| 按目录 | 一个目录/包 | 大型 monorepo |
| 按维度 | 一个审查视角 | 单文件，多视角深挖 |
| 按变更 | git diff 涉及的文件 | PR / CI 场景 |

## 相关章节

- 第 10 章：分片审查完整讲解
- 第 11 章：PR 多维 Review（按维度分片）
- 第 08 章：parallel vs pipeline 核心对比