#!/usr/bin/env python3
"""
创建缺失的表
"""
import sys
from pathlib import Path
import requests

# 读取环境变量
env_file = Path("D:/蜂群网站项目/蜂群任务市场/backend/.env")
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            env_vars[key] = value

url = env_vars.get('SUPABASE_URL')
service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

# 使用 PostgreSQL 直连
import psycopg2
from urllib.parse import urlparse

# 从 Supabase URL 解析数据库连接信息
# 格式: https://<project-ref>.supabase.co
project_ref = url.split('//')[1].split('.')[0]

print(f"[INFO] 项目 ID: {project_ref}")
print("[INFO] 请使用 Supabase SQL Editor 执行以下 SQL:\n")

# 打印创建表的 SQL
sqls = [
    """-- 3. model_performance 表
CREATE TABLE model_performance (
    performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(model_id),
    task_type VARCHAR(20) NOT NULL,
    mean_score DECIMAL(3,2) NOT NULL,
    variance DECIMAL(5,4) NOT NULL,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    ai_win_rate DECIMAL(4,2),
    trend VARCHAR(10),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_model ON model_performance(model_id);
CREATE INDEX idx_performance_type ON model_performance(task_type);
CREATE INDEX idx_performance_score ON model_performance(mean_score DESC);""",
    
    """-- 4. tasks 表
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(user_id),
    title VARCHAR(200) NOT NULL,
    task_type VARCHAR(20) NOT NULL,
    requirement TEXT NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL,
    estimated_hours DECIMAL(4,1),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(task_type);""",
    
    """-- 5. task_submissions 表
CREATE TABLE task_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id),
    executor_id UUID NOT NULL REFERENCES users(user_id),
    executor_type VARCHAR(10) NOT NULL,
    submission_content JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    evaluation_score DECIMAL(3,2),
    is_winning BOOLEAN DEFAULT false
);

CREATE INDEX idx_submissions_task ON task_submissions(task_id);""",
    
    """-- 6. arbitration_votes 表
CREATE TABLE arbitration_votes (
    vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id),
    submission_id UUID NOT NULL REFERENCES task_submissions(submission_id),
    voter_id UUID NOT NULL,
    vote_approve BOOLEAN NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_task ON arbitration_votes(task_id);"""
]

for i, sql in enumerate(sqls, 3):
    print(f"{'='*60}")
    print(f"表 {i}:")
    print(sql)
    print()