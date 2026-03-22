#!/usr/bin/env python3
"""
测试 API Key 是否有效
"""
import requests

url = "https://agoismqarzchkszihysr.supabase.co"
anon_key = "sb_publishable_WQgiyigwGhzMyeF2DCw27Q_XdW4WRp"

headers = {
    'apikey': anon_key,
    'Authorization': f'Bearer {anon_key}'
}

print("[TEST] 测试 API Key...")
print(f"  URL: {url}")
print(f"  Key: {anon_key[:20]}...\n")

response = requests.get(
    f'{url}/rest/v1/tasks?select=*&limit=1',
    headers=headers
)

print(f"  状态码: {response.status_code}")
print(f"  响应: {response.text[:200]}")

if response.status_code == 200:
    print("\n[OK] API Key 有效！")
else:
    print(f"\n[ERROR] API Key 无效或 RLS 问题")