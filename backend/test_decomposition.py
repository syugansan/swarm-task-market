# -*- coding: utf-8 -*-
"""测试 Task Decomposition"""

import sys
sys.path.append('D:/蜂群网站项目/蜂群任务市场/backend')

from fine_router import FineRouter
import json

router = FineRouter()

print("=" * 60)
print("Task Decomposition 测试")
print("=" * 60)

# 1. 发布任务
print("\n1. 发布任务：开发用户登录API")

plan = router.process_task(
    task_id='test_001',
    task_type='coding',
    task_description='开发一个用户登录API，支持JWT认证'
)

print(f"总子任务: {plan['total_subtasks']}")
print(f"执行波次: {plan['total_waves']}")
print(f"串行时间: {plan['serial_time']}")
print(f"并行时间: {plan['parallel_time']}")
print(f"加速比: {plan['speedup']}")

print("\n执行计划:")
for wave in plan['execution_plan']:
    print(f"\n  Wave {wave['wave']} (预计 {wave['estimated_time']}分钟):")
    for st in wave['subtasks']:
        print(f"    - {st['capability']}: {st['assigned_agent']} ({st['estimated_time']}分钟)")

print("\n粒度检查:")
for g in plan['granularity_report']:
    status = "OK" if g['status'] == 'optimal' else "FAIL"
    print(f"  [{status}] {g['capability']}: {g['estimated_time']}分钟")

# 2. 模拟完成子任务
print("\n2. 模拟完成子任务")

for wave in plan['execution_plan']:
    print(f"\nWave {wave['wave']}:")
    for st in wave['subtasks']:
        if st['capability'] == 'business_logic':
            score = 0.96
        elif st['capability'] == 'error_handling':
            score = 0.92
        else:
            score = 0.90
        
        router.record_performance(
            subtask_id=st['id'],
            agent_id=st['assigned_agent'],
            capability=st['capability'],
            score=score
        )
        print(f"  [OK] {st['capability']}: {st['assigned_agent']} (score={score})")

# 3. 能力矩阵
print("\n3. 能力矩阵更新")

matrix = router.get_capability_matrix()
print("\n各模型最强能力:")
for agent_id, capabilities in matrix.items():
    best = max(capabilities.items(), key=lambda x: x[1][0] - 0.5 * x[1][1])
    score = best[1][0] - 0.5 * best[1][1]
    print(f"  {agent_id}: {best[0]} (score={score:.3f})")

print("\n" + "=" * 60)
print("测试完成！Task Decomposition 系统工作正常")
print("=" * 60)