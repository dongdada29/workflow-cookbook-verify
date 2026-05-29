/**
 * 06-multi-dim-review.js
 * 第 11 章 · PR 多维 Review
 * 
 * 真实运行：Run ID wf_4c5caabb-b73
 * 3 维度并发评审（a11y / perf / correctness）→ synthesize 综合去重
 * 26 条原始发现 → 16 个问题
 */

export const meta = {
  name: 'frontend-review',
  description: 'Multi-dimension review: a11y, performance, correctness in parallel, then synthesize',
  phases: [{ title: 'Review' }, { title: 'Synthesize' }],
}

// 被评审的文件（实际使用时应替换为真实路径）
const TARGET_FILE = args.file || '/path/to/your/file.html'

// 所有维度共用同一套发现 schema
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          title: { type: 'string' },
          detail: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'title', 'detail', 'fix'],
      },
    },
  },
  required: ['findings'],
}

// 三个正交维度
const DIMS = [
  {
    key: 'a11y',
    prompt:
      `You are an accessibility (a11y) reviewer. Read ${TARGET_FILE} and find WCAG / keyboard / ` +
      `screen-reader / focus / contrast / landmark issues. Be specific with selectors and WCAG refs.`,
  },
  {
    key: 'perf',
    prompt:
      `You are a web performance reviewer. Read ${TARGET_FILE} and find render-blocking resources, ` +
      `layout thrash, unthrottled handlers, oversized/eager assets, main-thread work. Be specific.`,
  },
  {
    key: 'correct',
    prompt:
      `You are a correctness/security reviewer. Read ${TARGET_FILE} and find XSS sinks, race conditions, ` +
      `state desync, missing error handling, logic bugs. Be specific and show the offending code.`,
  },
]

phase('Review')
// 三维并发评审：parallel 屏障，等全部完成
const reviews = await parallel(
  DIMS.map((d) => () =>
    agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA })
      .then((r) => ({ dim: d.key, findings: (r && r.findings) || [] }))
  )
)
// 屏障释放后：过滤 + 扁平化 + 打标签
const all = reviews.filter(Boolean).flatMap((r) => r.findings.map((f) => ({ ...f, dim: r.dim })))

phase('Synthesize')
// 综合 agent 看到全部发现：去重 + 按严重度排序
const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          title: { type: 'string' },
          action: { type: 'string' },
          dims: { type: 'array', items: { type: 'string' } },
        },
        required: ['rank', 'severity', 'title', 'action'],
      },
    },
    blockers: { type: 'array', items: { type: 'number' } },
  },
  required: ['issues'],
}

const summary = await agent(
  `These are ${all.length} findings (JSON): ${JSON.stringify(all)}. ` +
    `Dedup across dimensions, rank by severity, and produce a prioritized action list. ` +
    `Mark which ranks are release blockers.`,
  { label: 'synthesize', phase: 'Synthesize', schema: SUMMARY_SCHEMA }
)

const byDimension = DIMS.reduce(
  (acc, d) => ({ ...acc, [d.key]: all.filter((f) => f.dim === d.key).length }),
  {}
)
return { rawCount: all.length, byDimension, ...summary }