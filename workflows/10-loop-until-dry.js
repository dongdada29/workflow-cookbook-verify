/**
 * 10-loop-until-dry.js
 * 第 18 章 · 循环到干与完整性批评
 * 
 * 核心模式：不确定需要多少轮，循环直到连续 N 轮无新发现
 * 三重停止判据：连续空轮 / 轮次上限 / 预算耗尽
 * 
 * 场景：找出代码中的 bug，不知道有多少个，
 * 可能 5 个也可能 50 个，循环到干才停
 */

export const meta = {
  name: 'loop-until-dry',
  description: 'Repeatedly search for bugs until no new ones found for 2 consecutive rounds',
  phases: [
    { title: 'Hunt', detail: 'Iterative bug hunting until dry' },
    { title: 'Dedup', detail: 'Deduplicate and rank findings' },
  ],
}

const MAX_ROUNDS = 5          // 主刹车：轮次上限
const ROUND_COST = 60000      // 每轮预算估算
const DRY_THRESHOLD = 2       // 连续 N 轮无新发现则停止

const BUG_SCHEMA = {
  type: 'object',
  properties: {
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          location: { type: 'string' },
          description: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['id', 'title', 'severity', 'location', 'description'],
      },
    },
  },
  required: ['bugs'],
}

// 目标代码（通过 args 传入或使用默认示例）
const TARGET = args.target || 'a typical Express.js REST API with auth, CRUD, and webhook handlers'

phase('Hunt')
const allBugs = []
const seen = new Set()
let consecutiveEmpty = 0
let round = 0

const ANGLES = [
  'error handling: uncaught exceptions, missing try/catch, swallowed errors',
  'concurrency: race conditions, deadlocks, resource leaks, missing locks',
  'logic bugs: off-by-one, wrong conditions, missing edge cases',
  'security: injection, auth bypass, information leakage, privilege escalation',
  'data integrity: partial updates, missing validation, type coercion issues',
]

while (round < MAX_ROUNDS) {
  // 刹车 1：预算检查
  if (budget.total && budget.remaining() < ROUND_COST) {
    log(`budget low: ${Math.round(budget.remaining()/1000)}k remaining, stopping`)
    break
  }

  const angle = ANGLES[round % ANGLES.length]
  const alreadyFound = allBugs.length > 0
    ? `\nAlready found (do NOT repeat these): ${JSON.stringify(allBugs.map(b => b.id + ': ' + b.title))}`
    : ''

  const result = await agent(
    `You are a bug hunter. Analyze: ${TARGET}\n\n` +
    `Focus angle for this round: ${angle}\n` +
    `Find NEW bugs from this specific angle. Each bug must have a unique id.` +
    alreadyFound,
    { label: `hunt:r${round+1}`, phase: 'Hunt', schema: BUG_SCHEMA }
  )

  if (!result) {
    log(`round ${round+1}: agent failed, stopping`)
    break
  }

  // 去重：只保留新发现
  const newBugs = result.bugs.filter(b => {
    const key = `${b.id}:${b.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (newBugs.length === 0) {
    consecutiveEmpty++
    log(`round ${round+1}/${MAX_ROUNDS}: 0 new bugs (consecutive empty: ${consecutiveEmpty}/${DRY_THRESHOLD})`)
  } else {
    consecutiveEmpty = 0
    allBugs.push(...newBugs)
    log(`round ${round+1}/${MAX_ROUNDS}: ${newBugs.length} new bugs (total: ${allBugs.length})`)
  }

  // 刹车 2：连续空轮
  if (consecutiveEmpty >= DRY_THRESHOLD) {
    log(`dried up: ${DRY_THRESHOLD} consecutive empty rounds, stopping`)
    break
  }

  round++
}

phase('Dedup')
// 按严重度排序
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
const ranked = allBugs.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))

log(`loop-until-dry complete: ${round+1} rounds, ${allBugs.length} unique bugs found`)
return {
  roundsRun: round + 1,
  totalBugs: allBugs.length,
  stoppedBecause: consecutiveEmpty >= DRY_THRESHOLD ? 'dry' : round >= MAX_ROUNDS ? 'max-rounds' : 'budget',
  bugs: ranked,
}
