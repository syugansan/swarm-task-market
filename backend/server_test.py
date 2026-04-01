#!/usr/bin/env python3
# Test deployment routing on server

import sys
sys.path.insert(0, '/var/www/swarm-market')

from fine_router import FineRouter

router = FineRouter()

# Test deployment task
print("=" * 60)
print("Deployment Task Routing Test")
print("=" * 60)

plan = router.process_task(
    task_id='deploy_test',
    task_type='deployment',
    task_description='Deploy Next.js frontend to server'
)

print(f"Total Subtasks: {plan['total_subtasks']}")
print(f"Total Waves: {plan['total_waves']}")

print("\nSubtask Assignment:")
for wave in plan['execution_plan']:
    print(f"\n  Wave {wave['wave']}:")
    for st in wave['subtasks']:
        print(f"    - {st['capability']} -> {st['assigned_agent']}")

# Show capability rankings
print("\n" + "=" * 60)
print("Deployment Capability Rankings")
print("=" * 60)

matrix = router.get_capability_matrix()
deployment_scores = []
for agent, caps in matrix.items():
    if 'deployment' in caps:
        mean, var = caps['deployment']
        score = mean - 0.5 * var
        deployment_scores.append((agent, score))

deployment_scores.sort(key=lambda x: x[1], reverse=True)
for agent, score in deployment_scores:
    print(f"  {agent}: {score:.3f}")