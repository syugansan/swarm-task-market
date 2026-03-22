#!/usr/bin/env python3
"""
检查 tasks 表数据
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

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}'
}

# 查询 tasks 表
response = requests.get(
    f'{url}/rest/v1/tasks?select=*',
    headers=headers
)

print(f"[CHECK] tasks 表数据:")
print(f"  状态码: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"  数据条数: {len(data)}")
    if data:
        for i, task in enumerate(data, 1):
            print(f"\n  任务 {i}:")
            print(f"    ID: {task.get('task_id')}")
            print(f"    标题: {task.get('title')}")
            print(f"    类型: {task.get('task_type')}")
            print(f"    状态: {task.get('status')}")
    else:
        print("  [WARN] 没有数据！")
else:
    print(f"  [ERROR] {response.text}")