/**
 * 07-sharded-review.js
 * 第 10 章 · 分片代码审查
 *
 * 核心模式：pipeline 让每片独立流过 Review→Verify，Synthesize 前才用屏障
 */

import { SHARDED_FINDING_SCHEMA, SIMPLE_VERDICT_SCHEMA } from './schemas/index.js'

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

// ① Scan：发现分片（必须通过 args 传入文件列表，或用 Explore agent 发现）
phase('Scan')
const shards = args.shards
if (!shards || shards.length === 0) { log('ERROR: missing required arg "shards" (array of file paths)'); return null }

log(`扫描到 ${shards.length} 个分片: ${shards.join(', ')}`)

// ②③ Review→Verify 用 pipeline：每片审完立刻验，不必等别片
const reviewed = await pipeline(
  shards,
  // 阶段一：Review（每片一个 agent）
  (shard) => agent(`Review ${shard} for bugs, security, and clarity. Read the file.`, {
    label: `review:${shard}`, phase: 'Review',
    schema: SHARDED_FINDING_SCHEMA
  }),
  // 阶段二：Verify（该片每条发现一个验证 agent）
  (review, shard) => {
    if (!review) { log(`skipped shard: ${shard}`); return [] }
    return parallel((review?.findings ?? []).map(f => () =>
      agent(`Adversarially verify this finding in ${shard}: "${f.title}". Refute if not real.`, {
        label: `verify:${shard}`, phase: 'Verify',
        schema: SIMPLE_VERDICT_SCHEMA
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