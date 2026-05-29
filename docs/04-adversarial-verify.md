# 04-adversarial-verify.js 配方说明

## 章节出处

第 17 章 · 对抗验证

## 配方动机

解决「自我评估的根本缺陷」：
- 让同一个模型评自己的产物，会有确认偏误
- 需要一个**独立**的 subagent，被明确要求「挑刺」

核心思想：**生成与验证分离**

## 真实运行数据

最小对抗验证见 pipeline-demo（Run ID `wf_bf086b98-6ec`）
- 3 items × 2 stages = 6 agents
- Find 阶段生成候选，Verify 阶段对抗性核验

## 核心代码模式

```javascript
// pipeline 两阶段：Find → Verify
const reviewed = await pipeline(
  TARGETS,
  // 阶段一：生成者（独立上下文）
  (target) =>
    agent(`Identify a potential ${target} issue...`, {
      label: `find:${target}`, phase: 'Find', schema: FINDING_SCHEMA
    }),
  // 阶段二：验证者（明确要求「证伪」，不是「确认」）
  (found, target) =>
    agent(
      'You are a strict red-team reviewer. Your job is to REFUTE claims, not confirm them. ' +
      'Only mark "confirmed" if you can find NO counter-evidence...\n\n' +
      `Claim: ${found.claim}\nEvidence: ${found.evidence}`,
      { label: `verify:${target}`, phase: 'Verify', schema: VERDICT_SCHEMA }
    ).then((v) => ({ target, ...found, ...v }))
)
```

## 判决 schema（三态枚举）

```javascript
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'refuted', 'uncertain'] },
    confidence: { type: 'number' },
    reasoning: { type: 'string' },
  },
  required: ['verdict', 'confidence', 'reasoning'],
}
```

三态设计：对付「证据不足，判不了」的情况，避免逼模型瞎猜

## 验证者 prompt 三要素

1. **给红队角色**：明确说「你的职责是证伪」
2. **要它举证**：判 refuted 时必须给出反例
3. **只给结论+原始证据**：不给生成者的推理过程

## 收口逻辑

```javascript
const confirmed = valid.filter((r) => r.verdict === 'confirmed')
const uncertain = valid.filter((r) => r.verdict === 'uncertain')
const refuted = valid.filter((r) => r.verdict === 'refuted')
```

**默认判 refuted**：举证责任在「确认」一方，沉默与分歧都倒向证伪

## 进阶：多验证者投票

当判决代价很高时，用 `parallel` 扇出 N 个验证者，再计票聚合

## 相关章节

- 第 17 章：对抗验证完整讲解
- 第 12 章：GCF 循环（生成-批评-修复）
- 第 14 章：评委面板（多评委投票）