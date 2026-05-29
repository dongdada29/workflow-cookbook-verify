# Workflow Cookbook Verification Project

验证《织经 · Claude Code 多 Agent 编排实战手册》中的核心方案。

基于 https://agi-is-going-to-arrive.github.io/workflow-cookbook/ 的配方实现。

## 目录结构

```
workflow-cookbook-verify/
├── workflows/                    # Workflow 脚本（供 Claude Code 执行）
│   ├── 01-hello-workflow.js     # 第 04 章：Hello World
│   ├── 02-parallel-demo.js      # 第 08 章：parallel 屏障
│   ├── 03-pipeline-demo.js      # 第 08 章：pipeline 流水线
│   ├── 04-adversarial-verify.js # 第 17 章：对抗验证
│   ├── 05-gcf-loop.js           # 第 12 章：生成-批评-修复循环
│   ├── 06-multi-dim-review.js  # 第 11 章：PR 多维 Review
│   ├── 07-sharded-review.js     # 第 10 章：分片代码审查
│   └── 08-judge-panel.js        # 第 14 章：评委面板
├── scripts/                     # 本地测试/验证脚本
├── docs/                        # 配方说明文档
└── README.md
```

## 运行方式

这些是 **Workflow 脚本**，不是普通 Node.js 脚本。正确运行方式：

```bash
# 1. 启动 Claude Code 并开启 Workflow 功能
CLAUDE_CODE_WORKFLOWS=1 claude

# 2. 在 Claude Code 对话中，让 Claude 执行脚本
# 例如：把 workflows/01-hello-workflow.js 的内容发给 Claude
# 或者对 Claude 说："执行这个 workflow"，并附上脚本内容
```

## 配方索引

| 配方 | 章节 | 核心模式 | 关键词 |
|------|------|---------|--------|
| `01-hello-workflow` | Ch04 | 最小工作流 | schema 强制结构化输出 |
| `02-parallel-demo` | Ch08 | parallel 屏障 | 3 并发 agent，结果数组 |
| `03-pipeline-demo` | Ch08 | pipeline 流水线 | 3 项×2 阶段，阶段间无屏障 |
| `04-adversarial-verify` | Ch17 | 对抗验证 | Find→Verify，refute-by-default |
| `05-gcf-loop` | Ch12 | GCF 循环 | Generate→Critique→Fix |
| `06-multi-dim-review` | Ch11 | 多维评审 | parallel 屏障收口 + synthesize |
| `07-sharded-review` | Ch10 | 分片审查 | pipeline 无屏障 + 全局屏障收口 |
| `08-judge-panel` | Ch14 | 评委面板 | 多评委投票，计票选优 |

## 前置条件

- Claude Code v2.1.150+
- 环境变量 `CLAUDE_CODE_WORKFLOWS=1`
- 可选：`CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-4-7[1m]`

## 参考资料

- 原书：https://agi-is-going-to-arrive.github.io/workflow-cookbook/
- GitHub：https://github.com/AGI-is-going-to-arrive/workflow-cookbook