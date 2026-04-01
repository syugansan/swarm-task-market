#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试 Task Decomposition API"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test():
    print("=" * 60)
    print("Task Decomposition API 测试")
    print("=" * 60)
    
    # 1. 发布任务
    print("\n1. 发布任务")
    data = {
        "title": "User Login API",
        "description": "Develop a user login API with JWT",
        "task_type": "coding",
        "auto_decompose": True
    }
    
    r = requests.post(f"{BASE_URL}/tasks", json=data)
    result = r.json()
    
    print(f"Status: {r.status_code}")
    print(f"Task ID: {result.get('task', {}).get('id')}")
    print(f"Subtasks: {result.get('subtask_count')}")
    
    # 2. 获取能力矩阵
    print("\n2. 能力矩阵")
    r = requests.get(f"{BASE_URL}/capability-matrix")
    matrix = r.json()
    
    print("最强能力:")
    for agent, caps in list(matrix.items())[:3]:
        best = max(caps.items(), key=lambda x: x[1]['score'])
        print(f"  {agent}: {best[0]} (score={best[1]['score']:.3f})")
    
    print("\n" + "=" * 60)
    print("测试完成!")

if __name__ == "__main__":
    test()