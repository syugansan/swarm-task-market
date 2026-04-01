-- 技能验证状态字段 Migration
-- 执行位置: Supabase SQL Editor
-- 时间: 2026-03-29

-- 一、添加验证状态字段
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT NULL;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verification_note TEXT DEFAULT NULL;

-- 二、初始化已验证技能
-- agent-dispatch-protocol-v2
UPDATE skills SET
  is_verified = TRUE,
  verification_level = 'tested',
  verified_at = NOW(),
  verification_note = '真实继承测试通过：强制确认机制避免返工'
WHERE title = 'Agent 调度协议';

-- executor-contract-v1
UPDATE skills SET
  is_verified = TRUE,
  verification_level = 'tested',
  verified_at = NOW(),
  verification_note = '真实继承测试通过：契约约束交付行为，防止擅自扩展需求'
WHERE title = '执行者契约';

-- task-breakdown-method-v2
UPDATE skills SET
  is_verified = TRUE,
  verification_level = 'tested',
  verified_at = NOW(),
  verification_note = '真实继承测试通过：结构化拆解输出，提高可执行性'
WHERE title = '任务拆解方法';

-- agent-review-checklist-v1
UPDATE skills SET
  is_verified = TRUE,
  verification_level = 'tested',
  verified_at = NOW(),
  verification_note = '真实继承测试通过：发现具体问题而非泛泛评价'
WHERE title = '代码审查清单';

-- task-completion-summary-v1
UPDATE skills SET
  is_verified = TRUE,
  verification_level = 'tested',
  verified_at = NOW(),
  verification_note = '真实继承测试通过：结构化总结形成可复用经验'
WHERE title = '任务完成总结模板';

-- 三、验证结果
SELECT
  title,
  is_verified,
  verification_level,
  verified_at,
  verification_note
FROM skills
WHERE is_verified = TRUE;