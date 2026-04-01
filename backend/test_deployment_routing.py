# -*- coding: utf-8 -*-
"""Test deployment routing"""

import sys
sys.path.append('D:/蜂群网站项目/蜂群任务市场/backend')

from fine_router import FineRouter
import json

router = FineRouter()

# Test deployment task
print("=" * 60)
print("Test: Server Deployment Task Routing")
print("=" * 60)

plan = router.process_task(
    task_id='deploy_001',
    task_type='deployment',
    task_description='Deploy Next.js frontend to server'
)

print(f"Task Type: deployment")
print(f"Total Subtasks: {plan['total_subtasks']}")
print(f"Total Waves: {plan['total_waves']}")

print("\nSubtask Assignment:")
for wave in plan['execution_plan']:
    print(f"\n  Wave {wave['wave']}:")
    for st in wave['subtasks']:
        print(f"    - {st['capability']} -> {st['assigned_agent']}")

# Test devops task
print("\n" + "=" * 60)
print("Test: DevOps Task Routing")
print("=" * 60)

plan2 = router.process_task(
    task_id='devops_001',
    task_type='devops',
    task_description='Configure Nginx reverse proxy'
)

print(f"Task Type: devops")
print(f"Total Subtasks: {plan2['total_subtasks']}")

print("\nSubtask Assignment:")
for wave in plan2['execution_plan']:
    print(f"\n  Wave {wave['wave']}:")
    for st in wave['subtasks']:
        print(f"    - {st['capability']} -> {st['assigned_agent']}")

# View deployment capability rankings
print("\n" + "=" * 60)
print("Model Deployment Capability Rankings")
print("=" * 60)

matrix = router.get_capability_matrix()
deployment_scores = []
for agent, caps in matrix.items():
    if 'deployment' in caps:
        mean, var = caps['deployment']
        score = mean - 0.5 * var
        deployment_scores.append((agent, score, mean, var))

deployment_scores.sort(key=lambda x: x[1], reverse=True)
for agent, score, mean, var in deployment_scores:
    print(f"  {agent}: score={score:.3f} (mean={mean:.3f}, var={var:.4f})")

# View devops capability rankings
print("\nDevOps Capability Rankings:")
devops_scores = []
for agent, caps in matrix.items():
    if 'devops' in caps:
        mean, var = caps['devops']
        score = mean - 0.5 * var
        devops_scores.append((agent, score, mean, var))

devops_scores.sort(key=lambda x: x[1], reverse=True)
for agent, score, mean, var in devops_scores:
    print(f"  {agent}: score={score:.3f} (mean={mean:.3f}, var={var:.4f})")

# View debugging capability rankings
print("\nDebugging Capability Rankings:")
debug_scores = []
for agent, caps in matrix.items():
    if 'debugging' in caps:
        mean, var = caps['debugging']
        score = mean - 0.5 * var
        debug_scores.append((agent, score, mean, var))

debug_scores.sort(key=lambda x: x[1], reverse=True)
for agent, score, mean, var in debug_scores:
    print(f"  {agent}: score={score:.3f} (mean={mean:.3f}, var={var:.4f})")