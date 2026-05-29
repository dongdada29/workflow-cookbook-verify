/**
 * 07-sharded-review.js
 * 第 10 章 · 分片代码审查
 * 
 * 核心模式：pipeline 让每片独立流过 Review→Verify，Synthesize 前才用屏障
 */

export const meta = {
  name: 'sharded-review',
  description: 'Discover shards, review each independently, verify findings, synthesize',
  phases: [
    { title: 'Scan', detail: 'Discover code shards' },
    { title: 'Review', detail: 'Review each shard independently' },
    { title: 'Verify', detail: 'Adversarially verify findings' },
    { title: 'Synthesize', detail: 'Produce final report' },
  ],
}

// 发现 schema
const FINDING_SCHEMA = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object',
      properties: { severity: { type: 'string', enum: ['critical','high','medium','low'] },
                    shard: { type: 'string' }, title: { type: 'string' }, fix: { type: 'string' } },
      required: ['severity','title','fix'] } } }, required: ['findings']
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: { real: { type: 'boolean' } },
  required: ['real']
}

// ① Scan：发现分片（实际使用时应替换为真实文件列表或用 Explore agent 发现）
phase('Scan')
const shards = args.shards || ['src/auth.ts', 'src/cart.ts', 'src/checkout.ts']

log(`扫描到 ${shards.length} 个分片: ${shards.join(', ')}`)

// ②③ Review→Verify 用 pipeline：每片审完立刻验，不必等别片
const reviewed = await pipeline(
  shards,
  // 阶段一：Review（每片一个 agent）
  (shard) => agent(`Review ${shard} for bugs, security, and clarity. Read the file.`, {
    label: `review:${shard}`, phase: 'Review',
    schema: FINDING_SCHEMA
  }),
  // 阶段二：Verify（该片每条发现一个验证 agent）
  (review, shard) => {
    if (!review) { log(`skipped shard: ${shard}`); return [] }
    return parallel((review?.findings ?? []).map(f => () =>
      agent(`Adversarially verify this finding in ${shard}: "${f.title}". Refute if not real.`, {
        label: `verify:${shard}`, phase: 'Verify',
        schema: VERDICT_SCHEMA
      })
        .then(v => ({ ...f, shard, real: v && v.real }))
    )).then(rs => rs.filter(Boolean).filter(x => x.real))
  }
)

// ④ Synthesize：跨分片去重排序（需要全局视图，用屏障是正确的）
phase('Synthesize')
const all = reviewed.flat().filter(Boolean)
const report = await agent(
  `Deduplicate and prioritize these ${all.length} verified findings: ${JSON.stringify(all)}`,
  { label: 'synthesize', phase: 'Synthesize',
    schema: { type: 'object', properties: { top: { type: 'array', items: { type: 'object',
      properties: { severity: { type: 'string' }, title: { type: 'string' }, fix: { type: 'string' } }, required: ['severity','title','fix'] } } }, required: ['top'] } }
)
return report