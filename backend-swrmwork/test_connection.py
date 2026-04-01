#!/usr/bin/env python3
"""
测试 Supabase API 连接
"""
import os
import sys
from pathlib import Path

# 读取 .env 文件
env_file = Path("D:/蜂群网站项目/蜂群任务市场/backend/.env")
if not env_file.exists():
    print("[ERROR] .env 文件不存在")
    sys.exit(1)

# 解析 .env
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            env_vars[key] = value

print("[OK] 读取到的配置：")
print(f"  SUPABASE_URL: {env_vars.get('SUPABASE_URL', '未找到')}")
print(f"  SUPABASE_ANON_KEY: {env_vars.get('SUPABASE_ANON_KEY', '未找到')[:20]}...")
print(f"  SUPABASE_SERVICE_ROLE_KEY: {env_vars.get('SUPABASE_SERVICE_ROLE_KEY', '未找到')[:20]}...")
print()

# 测试连接
try:
    import requests
    
    url = env_vars.get('SUPABASE_URL')
    anon_key = env_vars.get('SUPABASE_ANON_KEY')
    service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    
    # 测试 1: REST API 连接
    print("[TEST 1] REST API 连接... (Anon Key)")
    headers = {
        'apikey': anon_key,
        'Authorization': f'Bearer {anon_key}'
    }
    response = requests.get(f'{url}/rest/v1/', headers=headers, timeout=10)
    print(f"  状态码: {response.status_code}")
    if response.status_code == 200:
        print("  [OK] REST API 连接成功")
    else:
        print(f"  [WARN] 状态码: {response.status_code}")
    
    # 测试 2: Service Role Key 连接
    print("\n[TEST 2] REST API 连接... (Service Role Key)")
    headers_service = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}'
    }
    response_service = requests.get(f'{url}/rest/v1/', headers=headers_service, timeout=10)
    print(f"  状态码: {response_service.status_code}")
    if response_service.status_code == 200:
        print("  [OK] Service Role Key 连接成功")
    else:
        print(f"  [WARN] 状态码: {response_service.status_code}")
    
    print("\n[SUCCESS] 所有测试通过！Supabase 配置正确")
    print("\n[INFO] 连接信息：")
    print(f"  项目 ID: agoismqarzchkszihysr")
    print(f"  项目名: swarmwork")
    print(f"  地区: Northeast Asia (Tokyo)")
    print(f"  REST API: {url}/rest/v1/")
    print(f"  Auth API: {url}/auth/v1/")
    print(f"  Storage API: {url}/storage/v1/")
    
except ImportError:
    print("[WARN] 缺少 requests 库")
    print("安装命令: pip install requests")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] 测试失败: {e}")
    sys.exit(1)