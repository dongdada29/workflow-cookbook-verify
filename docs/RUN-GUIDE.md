# 快速运行指南

## 环境准备

1. **确保安装了 Claude Code v2.1.150+**

2. **开启 Workflow 功能**
   ```bash
   # 方式一：临时开启（当前会话）
   CLAUDE_CODE_WORKFLOWS=1 claude
   
   # 方式二：永久开启（写入配置）
   # 编辑 ~/.claude/settings.json 添加：
   {
     "env": { "CLAUDE_CODE_WORKFLOWS": "1" }
   }
   ```

## 运行 Workflow

### 方式一：让 Claude 执行脚本内容

1. 启动 Claude Code：`CLAUDE_CODE_WORKFLOWS=1 claude`
2. 把 `workflows/` 目录下脚本的内容发送给 Claude
3. 让 Claude 执行它们，例如：
   ```
   请执行这个 Workflow 脚本：
   [粘贴 workflows/01-hello-workflow.js 的内容]
   ```

### 方式二：把脚本发给 Claude 让它执行

在 Claude Code 对话中：
1. 说「ultrawork：跑这个工作流」并附上脚本
2. Claude 会调用内置 Workflow 工具执行
3. 你会收到一个回执（taskId/runId）
4. 用 `/workflows` 查看实时进度
5. 完成后收到结果通知

## 推荐顺序

1. **01-hello-workflow** - 最小示例，验证环境
2. **02-parallel-demo** - 理解 parallel 屏障
3. **03-pipeline-demo** - 理解 pipeline 流水线
4. **04-adversarial-verify** - 对抗验证模式
5. **05-gcf-loop** - 生成-批评-修复循环
6. **06-multi-dim-review** - 多维评审
7. **07-sharded-review** - 分片审查
8. **08-judge-panel** - 评委面板

## 预期结果

每个 Workflow 运行时：
- 立即收到回执（taskId、runId）
- 用 `/workflows` 查看进度树
- 完成后收到结果通知

典型用量（单 agent）：
- ~5.5 秒 / ~26K token

典型用量（3 并发 parallel）：
- ~8.4 秒 / ~79K token

## 常见问题

**Q: `node hello.js` 报错 `phase is not defined`**
A: 这是正常的！Workflow 脚本不是 Node.js 脚本，必须由 Claude Code 执行。

**Q: 怎么查看进度？**
A: 在 Claude Code 中使用 `/workflows` 命令。

**Q: 脚本能修改吗？**
A: 能！Claude 可以直接编辑脚本然后重跑（用 scriptPath）。