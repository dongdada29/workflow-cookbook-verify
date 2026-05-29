# 08-judge-panel.js 配方说明

## 章节出处

第 14 章 · 评委面板（来自原书，因链接 404 暂缺详细内容）

## 配方动机

解决「单评委可能偏颇」的问题：
- 用多个独立评委，各自从不同视角评估
- 最后计票选出胜者（或综合评分）
- 比单评委更可靠

核心模式：**多评委独立评分 → 聚合 → 选出胜者**

## 真实运行数据

验证案例：3 评委 3:0 投票（Run ID `wf_f5b69668-b18`）

## 核心代码模式

```javascript
// 评委视角（用下标制造差异，不用 Math.random）
const JUDGE_PERSPECTIVES = [
  { name: 'Technical', focus: 'architectural soundness, scalability, maintainability' },
  { name: 'Business', focus: 'time-to-market, cost, business alignment' },
  { name: 'Risk', focus: 'failure modes, mitigation strategies, compliance' },
]

// 每个评委独立评估所有候选（parallel 屏障，等全部完成）
const judges = await parallel(
  JUDGE_PERSPECTIVES.map((j, i) => () =>
    agent(
      `You are the ${j.name} judge. Your focus: ${j.focus}.\n\n` +
      `Evaluate these candidates and provide scores (1-5) and a recommendation...`,
      { label: `judge:${j.name}`, phase: 'Judge', schema: SCORE_SCHEMA }
    )
  )
)

// 计票
const voteCounts = {}
CANDIDATES.forEach(c => { voteCounts[c.id] = 0 })
judges.forEach(j => { voteCounts[j.winner]++ })

// 找出票数最高的候选
let winner = Object.entries(voteCounts).reduce((a, [id, votes]) => 
  votes > a.votes ? { id, votes } : a, { id: null, votes: 0 }).id
```

## 关键设计

1. **评委视角差异化**：用下标 `i` 制造差异，不用 `Math.random`（脚本禁用随机）
2. **并行评审**：所有评委同时工作（parallel 屏障，等全部完成）
3. **计票选优**：简单多数票，或加权评分

## 与其他配方的关系

| 配方 | 评估者干什么 | 最终产物 |
|------|-------------|---------|
| 对抗验证 | 判真伪（confirmed/refuted/uncertain） | 筛选 |
| **评委面板** | **多评委选优（票数/评分）** | **winner** |
| GCF | 找缺陷 → 修复 | 改好的代码 |

## 组合用法

**评委面板 + GCF（N 选优后再精修）**：
1. 用 parallel 产出 N 个候选
2. 评委面板选出最好的
3. 只对胜者跑 GCF

这样既吃到「多候选」的多样性，又把昂贵的 GCF 集中在最有希望的那个上。

## 相关章节

- 第 14 章：评委面板完整讲解
- 第 12 章：GCF 循环（精修）
- 第 17 章：对抗验证（判真伪）