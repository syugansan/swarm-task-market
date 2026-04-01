"""
测试 Task Decomposition API v2

完整流程测试：
1. 发布任务（自动拆解）
2. 查看执行计划
3. 完成子任务
4. 查看能力矩阵更新
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_task_decomposition():
    print("=" * 60)
    print("测试 Task Decomposition API v2")
    print("=" * 60)
    
    # 1. 发布任务
    print("\n1. 发布任务：开发用户登录API")
    print("-" * 40)
    
    response = requests.post(f"{BASE_URL}/tasks", json={
        "title": "用户登录API",
        "description": "开发一个用户登录API，支持JWT认证",
        "task_type": "coding",
        "auto_decompose": True
    })
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    task = response.json()
    task_id = task['task']['id']
    
    print(f"任务ID: {task_id}")
    print(f"拆解状态: {task['decomposed']}")
    print(f"子任务数量: {task['subtask_count']}")
    
    # 2. 获取执行计划
    print("\n2. 查看执行计划")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/plan")
    plan = response.json()
    
    print(f"总子任务: {plan['total_subtasks']}")
    print(f"执行波次: {plan['total_waves']}")
    print(f"串行时间: {plan['serial_time']}")
    print(f"并行时间: {plan['parallel_time']}")
    print(f"加速比: {plan['speedup']}")
    
    print("\n执行波次详情:")
    for wave in plan['execution_plan']:
        print(f"\n  Wave {wave['wave']} (预计 {wave['estimated_time']}分钟):")
        for st in wave['subtasks']:
            print(f"    - {st['capability']}: {st['assigned_agent']} ({st['estimated_time']}分钟)")
    
    # 3. 获取子任务列表
    print("\n3. 查看子任务列表")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/tasks/{task_id}/subtasks")
    subtasks = response.json()
    
    print(f"子任务总数: {subtasks['total']}")
    
    # 按波次分组显示
    waves = {}
    for st in subtasks['subtasks']:
        wave = st['wave']
        if wave not in waves:
            waves[wave] = []
        waves[wave].append(st)
    
    for wave_num in sorted(waves.keys()):
        print(f"\n  Wave {wave_num}:")
        for st in waves[wave_num]:
            print(f"    - [{st['id'][:8]}] {st['capability']} -> {st['assigned_agent']}")
    
    # 4. 模拟完成子任务
    print("\n4. 完成子任务（模拟）")
    print("-" * 40)
    
    # 按波次顺序完成
    for wave_num in sorted(waves.keys()):
        print(f"\nWave {wave_num}:")
        for st in waves[wave_num]:
            # 模拟不同质量
            if st['capability'] == 'business_logic':
                score = 0.96  # Qwen3 强项
            elif st['capability'] == 'error_handling':
                score = 0.92  # Claude 强项
            else:
                score = 0.90
            
            response = requests.post(
                f"{BASE_URL}/subtasks/{st['id']}/complete",
                json={
                    "agent_id": st['assigned_agent'],
                    "score": score,
                    "result": f"完成 {st['capability']}"
                }
            )
            
            if response.status_code == 200:
                print(f"  ✓ {st['capability']}: score={score}")
            else:
                print(f"  ✗ {st['capability']}: {response.text}")
    
    # 5. 检查任务状态
    print("\n5. 检查任务状态")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/tasks")
    tasks = response.json()
    
    for t in tasks:
        if t['id'] == task_id:
            print(f"任务状态: {t['status']}")
            print(f"进度: {t['progress']['completed']}/{t['progress']['total']}")
    
    # 6. 查看能力矩阵
    print("\n6. 查看能力矩阵")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/capability-matrix")
    matrix = response.json()
    
    print("\n各模型最强能力:")
    for agent_id, capabilities in matrix.items():
        best = max(capabilities.items(), key=lambda x: x[1]['score'])
        print(f"  {agent_id}: {best[0]} (score={best[1]['score']})")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    test_task_decomposition()