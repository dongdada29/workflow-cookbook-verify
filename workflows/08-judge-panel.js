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

// 评分 schema：每个候选打分（1-5）+ 综合评语
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

// 评委视角（用固定视角制造差异，不用 Math.random）
const JUDGE_PERSPECTIVES = [
  { name: 'Technical', focus: 'architectural soundness, scalability, maintainability' },
  { name: 'Business', focus: 'time-to-market, cost, business alignment' },
  { name: 'Risk', focus: 'failure modes, mitigation strategies, compliance' },
]

phase('Judge')
// 每个评委独立评估所有候选，带评委名字方便后续映射
const judges = await parallel(
  JUDGE_PERSPECTIVES.map((j, i) => () =>
    agent(
      `You are the ${j.name} judge (perspective ${i + 1}/${JUDGE_PERSPECTIVES.length}). ` +
      `Your focus: ${j.focus}.\n\n` +
      `Evaluate these candidates and provide scores (1-5) and a recommendation:\n` +
      CANDIDATES.map(c => `- ${c.id}: ${c.desc}`).join('\n'),
      { label: `judge:${j.name}`, phase: 'Judge', schema: SCORE_SCHEMA }
    ).then(r => r ? { ...r, judgeName: j.name } : null)
  )
)

const validJudges = judges.filter(Boolean)
if (validJudges.length === 0) {
  log('all judges failed')
  return null
}

phase('Vote')

// 计票维度一：简单多数票（每个评委的 winner 投一票）
const voteCounts = {}
CANDIDATES.forEach(c => { voteCounts[c.id] = 0 })
validJudges.forEach(j => {
  if (voteCounts[j.winner] !== undefined) {
    voteCounts[j.winner]++
  }
})

// 计票维度二：加权评分（利用评委给出的 score 做平均）
const avgScores = {}
CANDIDATES.forEach(c => {
  const allScores = validJudges
    .flatMap(j => j.scores || [])
    .filter(s => s.candidateId === c.id)
    .map(s => s.score)
  avgScores[c.id] = allScores.length > 0
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 0
})

// 综合计票：票数相同则用平均分决胜
let maxVotes = 0
let winner = null
let tied = []
Object.entries(voteCounts).forEach(([id, votes]) => {
  if (votes > maxVotes) {
    maxVotes = votes
    winner = id
    tied = [id]
  } else if (votes === maxVotes) {
    tied.push(id)
  }
})

// 平票处理：用平均分决胜
if (tied.length > 1) {
  let bestScore = 0
  tied.forEach(id => {
    if (avgScores[id] > bestScore) {
      bestScore = avgScores[id]
      winner = id
    }
  })
  log(`平票 ${tied.join(',')}，按平均分决胜: ${JSON.stringify(avgScores)}`)
}

const totalJudges = validJudges.length
const consensusRatio = maxVotes / totalJudges

log(`投票结果: ${JSON.stringify(voteCounts)} | 平均分: ${JSON.stringify(avgScores)} | 评委数: ${totalJudges}`)
return {
  winner,
  votes: voteCounts,
  avgScores,
  consensus: `${maxVotes}/${totalJudges} (${Math.round(consensusRatio * 100)}%)`,
  judges: validJudges.map(j => ({
    perspective: j.judgeName,
    voted: j.winner,
    reasoning: j.reasoning,
  })),
}