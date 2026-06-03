/**
 * 09-budget-loop.js
 * 第 21 章 · 动态预算与规模化
 * 
 * 核心模式：根据 budget.remaining() 自适应工作深度
 * 三重停止判据：预算耗尽 / 条目上限 / 连续空结果
 * 
 * 运行方式：
 *   CLAUDE_CODE_WORKFLOWS=1 claude
 *   然后让 Claude 执行此脚本，可指定 token 预算
 */

export const meta = {
  name: 'budget-adaptive-scan',
  description: 'Scan code for issues with adaptive depth based on remaining token budget',
  phases: [
    { title: 'Plan', detail: 'Estimate cost per module' },
    { title: 'Scan', detail: 'Scan modules until budget runs out' },
    { title: 'Report', detail: 'Summarize findings' },
  ],
}

const COST_PER_MODULE = 50000   // 每个模块约消耗 50K token
const MAX_MODULES = 10          // 硬上限：最多扫描 10 个模块
const SCHEMA = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          title: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['severity', 'title', 'detail'],
      },
    },
  },
  required: ['module', 'issues'],
}

// 待扫描的模块列表（通过 args 传入或使用默认）
const MODULES = args.modules || [
  'src/auth', 'src/api', 'src/db', 'src/cache', 'src/queue',
  'src/middleware', 'src/utils', 'src/config', 'src/routes', 'src/models',
]

phase('Plan')
log(`budget: total=${budget.total || 'unlimited'}, remaining=${budget.total ? Math.round(budget.remaining()/1000) + 'k' : '∞'}`)
log(`modules to scan: ${MODULES.length}, cost/module ≈ ${Math.round(COST_PER_MODULE/1000)}k`)

phase('Scan')
const findings = []
let consecutiveEmpty = 0

for (let i = 0; i < Math.min(MODULES.length, MAX_MODULES); i++) {
  // 刹车 1：预算检查
  if (budget.total && budget.remaining() < COST_PER_MODULE) {
    log(`budget exhausted: ${Math.round(budget.remaining()/1000)}k remaining < ${Math.round(COST_PER_MODULE/1000)}k needed, stopping at module ${i+1}/${MODULES.length}`)
    break
  }

  const result = await agent(
    `Analyze the module "${MODULES[i]}" for bugs, security issues, and code smells. ` +
    `Focus on: error handling, input validation, race conditions, resource leaks. ` +
    `Be thorough but concise.`,
    { label: `scan:${MODULES[i]}`, phase: 'Scan', schema: SCHEMA }
  )

  if (!result) {
    log(`scan of ${MODULES[i]} failed (agent returned null)`)
    continue
  }

  const issueCount = result.issues.length
  if (issueCount === 0) {
    consecutiveEmpty++
    log(`module ${i+1}/${MODULES.length}: ${MODULES[i]} — clean (consecutive empty: ${consecutiveEmpty})`)
  } else {
    consecutiveEmpty = 0
    findings.push(result)
    log(`module ${i+1}/${MODULES.length}: ${MODULES[i]} — ${issueCount} issues found`)
  }

  // 刹车 2：连续空结果（说明代码质量不错，不必继续）
  if (consecutiveEmpty >= 3) {
    log(`3 consecutive clean modules, stopping early`)
    break
  }

  // 预算进度
  if (budget.total) {
    log(`progress: ${findings.reduce((s, f) => s + f.issues.length, 0)} issues, ${Math.round(budget.remaining()/1000)}k remaining`)
  }
}

phase('Report')
const allIssues = findings.flatMap(f => f.issues.map(i => ({ ...i, module: f.module })))
const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
allIssues.forEach(i => { if (bySeverity[i.severity] !== undefined) bySeverity[i.severity]++ })

log(`scan complete: ${findings.length} modules scanned, ${allIssues.length} total issues`)
return {
  modulesScanned: findings.length,
  totalIssues: allIssues.length,
  bySeverity,
  findings,
  budgetUsed: budget.total ? `${Math.round((budget.total - budget.remaining())/1000)}k / ${Math.round(budget.total/1000)}k` : 'unknown',
}
