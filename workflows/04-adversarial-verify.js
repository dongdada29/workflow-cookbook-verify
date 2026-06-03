/**
 * 04-adversarial-verify.js
 * 第 17 章 · 对抗验证
 *
 * 核心模式：Find（生成候选）→ Verify（独立对抗式证伪）
 * 验证者不与生成者共享上下文，被明确要求「挑刺」
 */

import { ADVERSARIAL_FINDING_SCHEMA, VERDICT_SCHEMA } from './schemas/index.js'

export const meta = {
  name: 'adversarial-verify',
  description: 'Generate candidates, then have independent agent try to refute each one',
  phases: [
    { title: 'Find', detail: 'Generate candidate findings' },
    { title: 'Verify', detail: 'Independent adversarial verification' },
  ],
}

const TARGETS = ['sql-injection', 'xss-vulnerability', 'race-condition']

phase('Find & Verify')
const reviewed = await pipeline(
  TARGETS,
  // 阶段一：生成者
  (target) =>
    agent(
      `Identify a potential ${target} issue in a typical web application. ` +
      `Provide a clear claim and the evidence supporting it.`,
      { label: `find:${target}`, phase: 'Find', schema: ADVERSARIAL_FINDING_SCHEMA }
    ),
  // 阶段二：独立对抗验证者
  (found, target) =>
    agent(
      'You are a strict red-team reviewer. Your job is to REFUTE claims, not confirm them. ' +
      'Only mark "confirmed" if you can find NO counter-evidence and the evidence is solid. ' +
      'If you can construct a counter-example or the claim relies on unverified assumptions, mark "refuted". ' +
      'If evidence is insufficient, mark "uncertain".\n\n' +
      `Claim: ${found.claim}\nEvidence: ${found.evidence}`,
      { label: `verify:${target}`, phase: 'Verify', schema: VERDICT_SCHEMA }
    ).then((v) => ({ target, ...found, ...v }))
)

// 收口：过滤 null，按判决分类
const valid = reviewed.filter(Boolean)

if (valid.length === 0) {
  log('no valid results from adversarial verification')
  return { confirmed: [], uncertain: [], refuted: [] }
}

const confirmed = valid.filter((r) => r.verdict === 'confirmed')
const uncertain = valid.filter((r) => r.verdict === 'uncertain')
const refuted = valid.filter((r) => r.verdict === 'refuted')

phase('Summarize')
log(`对抗验证完成：确认 ${confirmed.length} 项，存疑 ${uncertain.length} 项，误报 ${refuted.length} 项`)
return { confirmed, uncertain, refuted }