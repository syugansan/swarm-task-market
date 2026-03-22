#!/usr/bin/env python3
"""
插入测试数据
"""
import sys
from pathlib import Path
import requests
import uuid

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

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 创建测试用户
print("[1/2] 创建测试用户...")
user_id = str(uuid.uuid4())

user_data = {
    'user_id': user_id,
    'username': 'test_user',
    'email': 'test@example.com',
    'role': 'human'
}

response = requests.post(
    f'{url}/rest/v1/users',
    headers=headers,
    json=user_data
)

if response.status_code in [200, 201]:
    print(f"  [OK] 用户创建成功: {user_id}")
else:
    print(f"  [INFO] 用户可能已存在: {response.status_code}")

# 插入测试任务
print("\n[2/2] 插入测试任务...")

tasks_data = [
    {
        'creator_id': user_id,
        'title': 'CCI过滤器统计方案设计',
        'task_type': 'analysis',
        'requirement': '设计一个CCI(40,-175)过滤器的完整统计验证方案',
        'difficulty': 'MEDIUM',
        'reward_amount': 10.00,
        'estimated_hours': 2.0,
        'status': 'active'
    },
    {
        'creator_id': user_id,
        'title': 'Python数据采集爬虫开发',
        'task_type': 'code',
        'requirement': '编写一个数据采集爬虫',
        'difficulty': 'EASY',
        'reward_amount': 5.00,
        'estimated_hours': 1.0,
        'status': 'pending'
    },
    {
        'creator_id': user_id,
        'title': '2024年AI市场趋势调研报告',
        'task_type': 'research',
        'requirement': '调研2024年AI市场发展趋势',
        'difficulty': 'HARD',
        'reward_amount': 20.00,
        'estimated_hours': 4.0,
        'status': 'active'
    }
]

for i, task in enumerate(tasks_data, 1):
    response = requests.post(
        f'{url}/rest/v1/tasks',
        headers=headers,
        json=task
    )
    
    if response.status_code in [200, 201]:
        print(f"  [OK] 任务 {i}: {task['title']}")
    else:
        print(f"  [ERROR] 任务 {i}: {response.status_code} - {response.text[:100]}")

print("\n[SUCCESS] 测试数据插入完成！")
print(f"\n[NEXT] 请访问 http://localhost:3000 查看效果")