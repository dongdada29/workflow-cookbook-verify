/**
 * 08-judge-panel.js
 * 第 14 章 · 评委面板
 * 
 * 核心模式：多评委独立评分 → 计票选优
 * 验证：3 评委 3:0 投票（Run ID wf_f5b69668-b18）
 */

export const meta = {
  name: 'judge-panel',
  description: 'Multiple judges independently score candidates, then vote to select the winner',
  phases: [
    { title: 'Judge', detail: 'Each judge scores all candidates independently' },
    { title: 'Vote', detail: 'Count votes and select winner' },
  ],
}

// 候选方案（实际使用时应替换为真实内容）
const CANDIDATES = args.candidates || [
  { id: 'A', desc: 'Solution A: Monolithic architecture with all features in one service' },
  { id: 'B', desc: 'Solution B: Microservices with event-driven communication' },
]

// 评分 schema：每个维度打分（1-5）+ 综合评语
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' },
          score: { type: 'number', minimum: 1, maximum: 5 },
          reason: { type: 'string' },
        },
        required: ['candidateId', 'score', 'reason'],
      },
    },
    winner: { type: 'string' },
    reasoning: { type: 'string' },
  },
  required: ['scores', 'winner', 'reasoning'],
}

// 评委视角（用下标制造差异，不用 Math.random）
const JUDGE_PERSPECTIVES = [
  { name: 'Technical', focus: 'architectural soundness, scalability, maintainability' },
  { name: 'Business', focus: 'time-to-market, cost, business alignment' },
  { name: 'Risk', focus: 'failure modes, mitigation strategies, compliance' },
]

phase('Judge')
// 每个评委独立评估所有候选
const judges = await parallel(
  JUDGE_PERSPECTIVES.map((j, i) => () =>
    agent(
      `You are the ${j.name} judge (perspective ${i + 1}/${JUDGE_PERSPECTIVES.length}). ` +
      `Your focus: ${j.focus}.\n\n` +
      `Evaluate these candidates and provide scores (1-5) and a recommendation:\n` +
      CANDIDATES.map(c => `- ${c.id}: ${c.desc}`).join('\n'),
      { label: `judge:${j.name}`, phase: 'Judge', schema: SCORE_SCHEMA }
    )
  )
)

const validJudges = judges.filter(Boolean)

phase('Vote')
// 计票：统计每个候选获得的票数
const voteCounts = {}
CANDIDATES.forEach(c => { voteCounts[c.id] = 0 })

validJudges.forEach(j => {
  // 简单计票：每个评委的 winner 投一票
  // 实际应该考虑评分加权，但这里简化处理
  if (voteCounts[j.winner] !== undefined) {
    voteCounts[j.winner]++
  }
})

// 找出票数最高的候选
let maxVotes = 0
let winner = null
Object.entries(voteCounts).forEach(([id, votes]) => {
  if (votes > maxVotes) {
    maxVotes = votes
    winner = id
  }
})

const totalJudges = validJudges.length
const margin = maxVotes / totalJudges

log(`投票结果: ${JSON.stringify(voteCounts)} | 评委数: ${totalJudges}`)
return {
  winner,
  votes: voteCounts,
  margin: `${maxVotes}/${totalJudges}`,
  judges: validJudges.map(j => ({ name: j.winner, reasoning: j.reasoning })),
}