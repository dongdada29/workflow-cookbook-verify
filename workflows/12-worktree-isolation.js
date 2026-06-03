/**
 * 12-worktree-isolation.js
 * 第 19 章 · Worktree 隔离
 * 
 * 核心模式：让并行 agent 在独立 git worktree 中工作，防止文件编辑冲突
 * 
 * 适用场景：多个 agent 同时修改同一代码库的不同部分
 * isolation: 'worktree' 让每个 agent 在 .claude/worktrees/wf_<runId>-<n> 中独立操作
 * 
 * 代价：约 200–500ms 启动 + 额外磁盘占用；无改动时自动移除
 */

export const meta = {
  name: 'worktree-isolation',
  description: 'Parallel agents editing files in isolated git worktrees to prevent conflicts',
  phases: [
    { title: 'Plan', detail: 'Identify independent file changes' },
    { title: 'Edit', detail: 'Each agent edits in its own worktree' },
    { title: 'Report', detail: 'Summarize all changes' },
  ],
}

// 待修改的文件列表（通过 args 传入）
const FILES = args.files || [
  { path: 'src/utils/format.ts', task: 'Add JSDoc comments to all exported functions' },
  { path: 'src/utils/validate.ts', task: 'Add input validation and error messages' },
  { path: 'src/utils/transform.ts', task: 'Refactor to use functional style (no mutations)' },
]

phase('Plan')
log(`worktree demo: ${FILES.length} files to edit in parallel, each in isolated worktree`)

phase('Edit')
// 每个文件由一个 agent 在独立 worktree 中编辑
// isolation: 'worktree' 确保并行 agent 不会踩踏同一文件
const results = await parallel(
  FILES.map((f) => () =>
    agent(
      `Read the file ${f.path}. Then apply this change: ${f.task}\n` +
      `After editing, show a brief summary of what you changed.`,
      {
        label: `edit:${f.path}`,
        phase: 'Edit',
        isolation: 'worktree',
        schema: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            changes: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
          required: ['file', 'changes', 'summary'],
        },
      }
    )
  )
)

phase('Report')
const completed = results.filter(Boolean)
const failed = FILES.length - completed.length

log(`worktree edit complete: ${completed.length}/${FILES.length} succeeded, ${failed} failed`)

if (completed.length === 0) {
  log('all worktree agents failed')
  return null
}

return {
  filesEdited: completed.length,
  filesFailed: failed,
  changes: completed.map(r => ({
    file: r.file,
    changes: r.changes,
    summary: r.summary,
  })),
  note: 'Each agent ran in an isolated worktree (.claude/worktrees/wf_<runId>-<n>). ' +
        'Changes are in separate branches and need to be merged back.',
}
