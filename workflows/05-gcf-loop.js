/**
 * 05-gcf-loop.js
 * 第 12 章 · 生成-批评-修复循环（GCF）
 * 
 * 真实运行：Run ID wf_7472ceac-daa
 * 一个 30 行函数被揪出 10 个缺陷
 * 
 * 核心模式：多轮 Generate→Critique→Fix 循环，三重停止判据
 */

export const meta = {
  name: 'gcf-slugify',
  description: 'Generate-Critique-Fix loop producing a robust slugify (CJK + ASCII)',
  phases: [
    { title: 'Generate', detail: 'First draft' },
    { title: 'Iterate', detail: 'Critique → Fix loop until convergence' },
  ],
}

const MAX_ROUNDS = 3      // 主刹车：轮次上限
const ROUND_COST = 60000   // 每轮预算估算（用于 budget 检查）

phase('Generate')
const gen = await agent(
  'Write a JavaScript function `slugify(text)` that converts a heading into a URL anchor id. ' +
  'Requirements: keep CJK characters; spaces->hyphens; strip punctuation; collapse consecutive ' +
  'hyphens; lowercase ASCII; no leading/trailing hyphen. Return only the function code.',
  { label: 'generate', schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } }
)

if (!gen) { log('generate agent failed'); return null }

let current = gen.code
const history = []

phase('Iterate')
let round = 0
while (round < MAX_ROUNDS) {
  // 刹车 1：预算检查
  if (budget.total && budget.remaining() < ROUND_COST) {
    log(`budget low: ${Math.round(budget.remaining()/1000)}k remaining, stopping`)
    break
  }

  const crit = await agent(
    `You are an adversarial code reviewer. Critique this slugify for correctness bugs and edge cases ` +
    `(empty string, all-punctuation, mixed CJK/ASCII, leading numbers, collisions, unicode). ` +
    `Be specific. Code:\n${current}`,
    { label: `critique:r${round+1}`, schema: { type: 'object', properties: { issues: { type: 'array', items: { type: 'string' } } }, required: ['issues'] } }
  )

  if (!crit) { log('critique agent failed, stopping'); break }

  // 刹车 2：收敛退出（无新发现）
  if (crit.issues.length === 0) {
    log(`round ${round+1}: no issues found, converged`)
    break
  }

  const fixed = await agent(
    `Rewrite slugify to fix every one of these issues: ${JSON.stringify(crit.issues)}. ` +
    `Original:\n${current}\nReturn the final code and a one-line changelog.`,
    { label: `fix:r${round+1}`, schema: { type: 'object', properties: { code: { type: 'string' }, changelog: { type: 'string' } }, required: ['code', 'changelog'] } }
  )

  if (!fixed) { log('fix agent failed, stopping'); break }

  history.push({ round: round+1, issuesFound: crit.issues.length, changelog: fixed.changelog })
  current = fixed.code
  round++
  log(`GCF round ${round}: ${crit.issues.length} issues found and fixed`)
}

return { rounds: history, totalIssuesFixed: history.reduce((s, r) => s + r.issuesFound, 0), finalCode: current }