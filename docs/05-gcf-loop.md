# 05-gcf-loop.js 配方说明

## 章节出处

第 12 章 · 生成-批评-修复循环（GCF）

## 配方动机

解决「让 agent 自己检查自己」的缺陷：
- 同一个 agent 刚写完代码，会倾向于替自己辩护
- 需要一个**独立的** agent，被明确要求「挑刺」
- 并且**真的动手改**，而不只是说「看起来没问题」

## 真实运行数据

| 指标 | 值 |
|------|-----|
| Run ID | `wf_7472ceac-daa` |
| agent_count | 3 (Generate / Critique / Fix) |
| total_tokens | 96,468 |
| duration_ms | 180,724 |
| 发现的缺陷 | 10 个（含 2 个 CRITICAL） |

一个看着挺正经的 30 行 `slugify` 被揪出 10 个缺陷：
- CRITICAL: 正则缺 `/u` flag，emoji/astral 字符泄漏
- CRITICAL: CJK 范围写错/不全
- HIGH: 未 NFKD 规范化，`café` 与 `café` 产生不同 slug
- HIGH: 非 CJK/非拉丁脚本全被清空
- HIGH: 碰撞：`C++`、`C`、`C#` 都变成 `c-programming`
- ...

## 核心代码模式

```javascript
// 三阶段顺序流水线
phase('Generate')
const gen = await agent('Write a JavaScript function slugify...', {
  label: 'generate', schema: CODE_SCHEMA
})

phase('Critique')
const crit = await agent(
  `You are an adversarial code reviewer. Critique this slugify for correctness bugs ` +
  `and edge cases (empty string, all-punctuation, mixed CJK/ASCII, leading numbers, ` +
  `collisions, unicode). Be specific.\nCode:\n${gen.code}`,
  { label: 'critique', schema: ISSUES_SCHEMA }
)

phase('Fix')
const fixed = await agent(
  `Rewrite slugify to fix every one of these issues: ${JSON.stringify(crit.issues)}. ` +
  `Original:\n${gen.code}\nReturn the final code and a one-line changelog.`,
  { label: 'fix', schema: FIXED_SCHEMA }
)
```

## 关键设计

1. **Critique 必须结构化成 `issues` 数组**：不是散文，而是能逐条对账的清单
2. **Fix 同时拿到原版+issues**：在原版上改，保住对的部分
3. **要求 changelog**：让修复可审计

## 多轮迭代

```javascript
const MAX_ROUNDS = 3  // 主刹车：轮次上限
const ROUND_COST = 60000  // 用于预算检查

let current = firstDraft
let round = 0

while (round < MAX_ROUNDS) {
  // 预算检查
  if (budget.remaining() < ROUND_COST) break
  
  const crit = await agent(`Critique this code...\n${current}`, {...})
  if (crit.issues.length === 0) break  // 收敛退出
  
  const fixed = await agent(`Fix these issues...\n${JSON.stringify(crit.issues)}\nOriginal:\n${current}`, {...})
  current = fixed.code
  round++
}
```

**三重停止判据**：收敛 / 轮次上限 / 预算

## GCF vs 其他配方

| 配方 | 评估后干什么 | 产物 |
|------|-------------|------|
| 对抗验证 | 筛选（保留 confirmed） | 判决 |
| 评委面板 | 选优（选出胜者） | winner |
| **GCF** | **修复（据 issues 重写）** | **改好的产物** |

## 相关章节

- 第 12 章：GCF 完整讲解
- 第 17 章：对抗验证（判真伪）
- 第 14 章：评委面板（选优）