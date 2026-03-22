#!/usr/bin/env python3
"""
检查 Supabase 表是否存在
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
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json'
}

# 检查各表是否存在
tables = ['users', 'models', 'model_performance', 'tasks', 'task_submissions', 'arbitration_votes']

print("[CHECK] 检查表是否存在...\n")

for table in tables:
    try:
        response = requests.get(
            f'{url}/rest/v1/{table}?limit=1',
            headers=headers
        )
        status = "[OK]" if response.status_code == 200 else f"[ERROR {response.status_code}]"
        print(f"  {table}: {status}")
        if response.status_code != 200:
            print(f"    {response.text[:100]}")
    except Exception as e:
        print(f"  {table}: [ERROR] {e}")

print("\n[DONE] 检查完成")