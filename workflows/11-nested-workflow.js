/**
 * 11-nested-workflow.js
 * 第 20 章 · 嵌套 Workflow
 * 
 * 核心模式：用 workflow() 调用子工作流，把验证过的能力单元拼装成主流程
 * 铁律：嵌套仅一层；父子共享资源池
 * 
 * 本示例演示：
 * 1. 主工作流顺序调用两个子工作流（研究 + 验证）
 * 2. pipeline + workflow 组合（每个条目交给子工作流处理）
 */

export const meta = {
  name: 'nested-demo',
  description: 'Demonstrate workflow() nesting: call sub-workflows and pipeline+workflow composition',
  phases: [
    { title: 'Setup', detail: 'Create sub-workflow scripts on disk' },
    { title: 'Sequential', detail: 'Call two sub-workflows in sequence' },
    { title: 'Pipeline', detail: 'pipeline + workflow: each item runs a full sub-workflow' },
  ],
}

// ── 子工作流 A：快速分析 ──
// 这个脚本会被写入磁盘，供 workflow() 调用
const ANALYZE_SCRIPT = `
export const meta = {
  name: 'quick-analyze',
  description: 'Quick analysis of a topic, returns structured claims',
  phases: [{ title: 'Analyze' }],
}

phase('Analyze')
const result = await agent(
  'Analyze the following topic and extract key claims with confidence levels. ' +
  'Topic: ' + args.topic + '\\n' +
  'Return 3-5 claims, each with a claim text and confidence (high/medium/low).',
  { label: 'analyze', phase: 'Analyze', schema: {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['text', 'confidence'],
        },
      },
    },
    required: ['topic', 'claims'],
  }}
)
return result || { topic: args.topic, claims: [] }
`

// ── 子工作流 B：对抗验证 ──
const VERIFY_SCRIPT = `
export const meta = {
  name: 'quick-verify',
  description: 'Adversarial verification of claims',
  phases: [{ title: 'Verify' }],
}

phase('Verify')
const results = await parallel(
  (args.claims || []).map((c) => () =>
    agent(
      'You are a strict reviewer. Your job is to REFUTE claims, not confirm them. ' +
      'If you can find counter-evidence, mark refuted. ' +
      'Claim: ' + c.text,
      { label: 'verify', phase: 'Verify', schema: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string', enum: ['confirmed', 'refuted', 'uncertain'] },
          reasoning: { type: 'string' },
        },
        required: ['claim', 'verdict', 'reasoning'],
      }}
    )
  )
)
return { verified: results.filter(Boolean) }
`

phase('Setup')
log('nested workflow demo: demonstrating workflow() composition patterns')
log('NOTE: workflow() requires sub-workflows to be registered. This demo shows the pattern.')

// ── 模式 1：顺序调用两个子工作流 ──
phase('Sequential')

// 注意：以下 workflow() 调用需要子工作流已注册到 .claude/workflows/
// 这里展示的是正确的调用模式（示意，实际需要子工作流文件存在）
//
// const research = await workflow('quick-analyze', { topic: args.topic || 'microservices vs monolith' })
// log(`research produced ${research.claims.length} claims`)
//
// const verified = await workflow('quick-verify', { claims: research.claims })
// log(`verified: ${verified.verified.filter(v => v.verdict === 'confirmed').length} confirmed`)
//
// return { research, verified }

// ── 模式 2：pipeline + workflow 组合 ──
phase('Pipeline')

// 每个条目交给一个完整的子工作流处理
// const topics = args.topics || ['microservices', 'event-sourcing', 'CQRS']
// const results = await pipeline(
//   topics,
//   topic => workflow('quick-analyze', { topic }),
// )
// log(`analyzed ${results.filter(Boolean).length}/${topics.length} topics`)
// return { results: results.filter(Boolean) }

// ── 当前可运行的替代方案 ──
// 因为没有实际注册子工作流，用普通 agent 演示同样的编排逻辑
const TOPIC = args.topic || 'microservices vs monolith'

const analysis = await agent(
  `Analyze the topic: "${TOPIC}". Extract 3 key claims with confidence levels.`,
  { label: 'analyze', phase: 'Sequential', schema: {
    type: 'object',
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['text', 'confidence'],
        },
      },
    },
    required: ['claims'],
  }}
)

if (!analysis || analysis.claims.length === 0) {
  log('analysis failed or produced no claims')
  return null
}

log(`analysis produced ${analysis.claims.length} claims, now verifying each`)

const verdicts = await parallel(
  analysis.claims.map((c) => () =>
    agent(
      'You are a strict reviewer. Your job is to REFUTE claims, not confirm them. ' +
      'If you can find counter-evidence, mark refuted.\n' +
      `Claim: ${c.text}`,
      { label: `verify:${c.text.slice(0,20)}`, phase: 'Pipeline', schema: {
        type: 'object',
        properties: {
          verdict: { type: 'string', enum: ['confirmed', 'refuted', 'uncertain'] },
          reasoning: { type: 'string' },
        },
        required: ['verdict', 'reasoning'],
      }}
    ).then(v => v ? { ...c, ...v } : null)
  )
)

const valid = verdicts.filter(Boolean)
const confirmed = valid.filter(v => v.verdict === 'confirmed')

log(`verified: ${confirmed.length}/${valid.length} confirmed`)
return {
  topic: TOPIC,
  claims: analysis.claims.length,
  confirmed: confirmed.length,
  results: valid,
  note: 'This demo uses inline agents. In production, use workflow() to call registered sub-workflows.',
}
