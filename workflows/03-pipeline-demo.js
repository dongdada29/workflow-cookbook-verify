/**
 * 03-pipeline-demo.js
 * 第 08 章 · pipeline 流水线
 * 
 * 真实运行：Run ID wf_bf086b98-6ec
 * 3 项 × 2 阶段 = 6 个 agent
 * 阶段回调签名：(prevResult, originalItem, index)
 */

export const meta = {
  name: 'pipeline-demo',
  description: 'pipeline(): each item flows Find -> Verify independently, no barrier between stages',
  phases: [{ title: 'Find', detail: 'Produce a candidate' }, { title: 'Verify', detail: 'Adversarially check it' }],
}

const items = ['off-by-one', 'null-dereference', 'race-condition']

phase('Find')
const out = await pipeline(
  items,
  (kind) =>
    agent(`Give a one-line code example of a ${kind} bug.`, {
      label: `find:${kind}`, phase: 'Find',
      schema: { type: 'object', properties: { example: { type: 'string' } }, required: ['example'] },
    }),
  (found, kind) => {
    phase('Verify')
    return agent(`Is this genuinely a ${kind} bug? Example: "${found.example}". Reply boolean + short reason.`, {
      label: `verify:${kind}`, phase: 'Verify',
      schema: { type: 'object', properties: { real: { type: 'boolean' }, reason: { type: 'string' } }, required: ['real', 'reason'] },
    }).then((v) => ({ kind, ...found, ...v }))
  }
)
const valid = out.filter(Boolean)
log(`pipeline completed: ${valid.length}/${items.length} verified`)
return valid