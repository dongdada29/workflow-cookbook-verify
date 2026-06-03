# 研究笔记：AI Agent Workflow 共享 Schema 设计模式

## 关键源汇总（核心引用）

### A. 核心定义与背景
1. **LangChain 官方结构化输出文档** [https://docs.langchain.com/oss/python/langchain/structured-output]
2. **Anthropic Structured Outputs 文档** [https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs]
3. **OpenAI Structured Outputs 公告** [https://openai.com/index/introducing-structured-outputs-in-the-api/]

### B. 三种实现路径（关键 PydanticAI 实战文）
4. **掘金：LLM 返回的 JSON 又炸了？三种方案实测** [https://juejin.cn/post/7631888765674995739]
5. **51CTO：手写 LLM 结构化输出系统** [https://blog.51cto.com/u_16213585/14580497]
6. **SGLang 深度解析** [https://blog.csdn.net/m0_50709695/article/details/160060470]

### C. 演化与版本管理
7. **Snowplow SchemaVer 文档** [https://github.com/snowplow/documentation/main/docs/understanding-tracking-design/versioning-your-data-structures/index.md]
8. **JSON Schema 演化的版本控制** [https://www.restack.io/p/version-control-for-ai-answer-json-schemas-cat-ai]
9. **Model Versioning for AI: JSON Schemas** [https://www.restack.io/p/model-versioning-answer-understanding-json-schema-evolution-cat-ai]

### D. 反直觉发现（"DRY 在 LLM 中是毒药"）
10. **掘金：LLM 协作实战经验** [https://juejin.cn/post/7604853010171265065]
11. **博客园：LLM 是推理引擎不是数据库** [https://www.cnblogs.com/haihai1203/articles/20135161]

### E. JSON Schema 组合模式
12. **JSON Schema 组合使用方式** [https://blog.gitcode.com/a492be3fee4326c2ef07924b6f955c0b.html]

### F. 本项目相关
13. **织经项目背景** [https://fshex.com/h/24162]
14. **Dify Multi-Agent Role Schema** [https://blog.csdn.net/LiteCode/article/details/159073068]
15. **Zod 在 AI Agent 中的应用** [https://blog.csdn.net/gitblog_00857/article/details/151523657]

---

## 报告大纲（已定稿）

1. Executive Summary
2. 背景：AI Agent Workflow 中"共享 Schema"的本质
3. 三大设计模式（核心深挖）
   - 3.1 工厂模式（Factory + Base）
   - 3.2 JSON Schema 组合（allOf + $ref）
   - 3.3 Type-driven 派生（Zod/Pydantic 类型生成）
4. 三种实现路径：Prompt → Tool → Native
5. 演化与版本管理：SchemaVer / SemVer / 兼容性策略
6. LLM 时代 DRY 的边界（反直觉发现）
7. 主流框架对比矩阵
8. 反模式与失败模式
9. 决策框架与建议
10. 本项目（Workflow Cookbook）应用
11. 局限与待研究方向

---

## 写作要点
- 深度优先：每个模式要有"动机—实现—取舍"三段式
- 引用规范：每条关键论据都要带 URL
- 至少 2 张 Mermaid 图表
- 结尾给出对本项目（本仓库）的具体建议
