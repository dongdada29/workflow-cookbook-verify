/**
 * workflows/schemas/index.js
 * 工作流共享 Schema 定义
 *
 * 统一管理所有工作流的数据结构定义，确保一致性和可维护性
 *
 * 设计原则：
 *   1. 基础字段原子化（可复用的最小单元）
 *   2. 工厂函数支持场景化扩展
 *   3. 预定义常用 schema，开箱即用
 *   4. severity 枚举统一为 ['critical','high','medium','low']
 */

// ============================================
// 基础字段定义（可复用的原子字段）
// ============================================

const SEVERITY_FIELD = {
  type: 'string',
  enum: ['critical', 'high', 'medium', 'low'],
  description: '问题严重程度',
}

const TITLE_FIELD = {
  type: 'string',
  description: '问题标题',
}

const DETAIL_FIELD = {
  type: 'string',
  description: '问题详细描述',
}

const FIX_FIELD = {
  type: 'string',
  description: '修复建议',
}

// ============================================
// 基础 Schema 模板
// ============================================

/**
 * 基础发现项 Schema
 * 包含所有审查场景通用的核心字段：severity / title / detail / fix
 */
const BASE_FINDING_ITEM = {
  type: 'object',
  properties: {
    severity: SEVERITY_FIELD,
    title: TITLE_FIELD,
    detail: DETAIL_FIELD,
    fix: FIX_FIELD,
  },
  required: ['severity', 'title', 'detail', 'fix'],
}

/**
 * 创建发现列表 Schema 的工厂函数
 * @param {Object} [extraFields={}]   需要合并的额外字段（按对象浅合并）
 * @param {string[]} [extraRequired=[]] 额外的必填字段
 * @returns {Object} 形如 `{ type:'object', properties:{ findings:{ type:'array', items:{...} } }, required:['findings'] }`
 */
function createFindingsSchema(extraFields = {}, extraRequired = []) {
  return {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: { ...BASE_FINDING_ITEM.properties, ...extraFields },
          required: [...BASE_FINDING_ITEM.required, ...extraRequired],
        },
      },
    },
    required: ['findings'],
  }
}

// ============================================
// 预定义的常用 Schema
// ============================================

/**
 * 标准审查发现 Schema
 * 适用于：多维审查、综合性代码审查
 * 字段：severity / title / detail / fix
 */
export const FINDINGS_SCHEMA = createFindingsSchema()

/**
 * 分片审查发现 Schema
 * 在标准基础上增加 shard 字段
 * 字段：severity / title / detail / fix / shard
 */
export const SHARDED_FINDING_SCHEMA = createFindingsSchema(
  { shard: { type: 'string', description: '分片标识' } },
  ['shard']
)

/**
 * 对抗验证发现 Schema
 * 适用于：安全漏洞发现场景
 * 字段：claim / evidence
 */
export const ADVERSARIAL_FINDING_SCHEMA = {
  type: 'object',
  properties: {
    claim: { type: 'string', description: '发现声明' },
    evidence: { type: 'string', description: '支持证据' },
  },
  required: ['claim', 'evidence'],
}

/**
 * 标准验证结果 Schema
 * 包含详细的验证信息和置信度
 * 字段：verdict / confidence / reasoning
 */
export const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['confirmed', 'refuted', 'uncertain'],
      description: '验证结论',
    },
    confidence: { type: 'number', description: '置信度 (0-1)' },
    reasoning: { type: 'string', description: '验证推理过程' },
  },
  required: ['verdict', 'confidence', 'reasoning'],
}

/**
 * 简化验证结果 Schema
 * 仅包含布尔判断
 * 字段：real
 */
export const SIMPLE_VERDICT_SCHEMA = {
  type: 'object',
  properties: { real: { type: 'boolean', description: '是否为真实问题' } },
  required: ['real'],
}

// ============================================
// 导出工具函数
// ============================================

export { createFindingsSchema }
