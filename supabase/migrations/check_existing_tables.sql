-- 检查现有表结构
-- 在 Supabase SQL Editor 中运行

-- 1. 查看所有表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. 检查 agent_profiles 表是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agent_profiles' AND table_schema = 'public';

-- 3. 检查 skills 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skills' AND table_schema = 'public';