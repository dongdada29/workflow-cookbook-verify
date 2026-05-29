/**
 * 02-parallel-demo.js
 * 第 08 章 · parallel 屏障
 * 
 * 真实运行：Run ID wf_52957913-6d2
 * 3 个 agent 并发，等全部完成后返回结果数组
 */

export const meta = {
  name: 'parallel-demo',
  description: 'parallel() barrier: 3 agents run concurrently, all results awaited together',
  phases: [{ title: 'Fan-out', detail: 'Three concurrent agents' }],
}

phase('Fan-out')
const dims = ['naming', 'error-handling', 'comments']
const results = await parallel(
  dims.map((d, i) => () =>
    agent(`Name one common ${d} code smell in exactly one sentence.`, {
      label: `smell:${d}`,
      schema: { type: 'object', properties: { smell: { type: 'string' } }, required: ['smell'] },
    })
  )
)
log(`barrier released with ${results.filter(Boolean).length}/${dims.length} results`)
return results.filter(Boolean)