# 统计路由集成文档

## 核心公式

```
score = mean - α * variance
```

**其中**:
- `mean`: 历史平均分（质量）
- `variance`: 历史方差（稳定性）
- `α`: 方差惩罚系数（默认0.5）

---

## 集成方式

### 前端集成

```javascript
// 查询最佳agent
async function getBestAgent(taskType, minMean, maxVariance) {
  const response = await fetch(
    `/api/agents/best?task_type=${taskType}&min_mean=${minMean}&max_variance=${maxVariance}`
  );
  return await response.json();
}

// 更新性能数据
async function updatePerformance(agentId, taskType, score) {
  await fetch('/api/agents/performance', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      task_type: taskType,
      score: score
    })
  });
}
```

### 后端集成

```python
from statistical_router import find_best_agent, record_performance

# 任务分配
def assign_task(task):
    best_agents = find_best_agent(
        task_type=task['task_type'],
        alpha=0.5,
        min_samples=task['requirements']['min_performance']['min_count']
    )
    
    # 过滤性能要求
    filtered = [
        agent for agent in best_agents
        if agent['mean'] >= task['requirements']['min_performance']['min_mean']
        and agent['variance'] <= task['requirements']['min_performance']['max_variance']
    ]
    
    return filtered[0] if filtered else None

# 任务完成
def complete_task(task_id, score):
    task = get_task(task_id)
    
    # 记录表现
    record_performance(
        agent_id=task['executor'],
        task_type=task['task_type'],
        score=score
    )
```

---

## 数据流

```
用户发布任务
    ↓
提取 task_type
    ↓
调用 find_best_agent(task_type)
    ↓
过滤 min_performance 要求
    ↓
分配给最佳agent
    ↓
执行任务
    ↓
审查打分
    ↓
调用 record_performance(agent_id, task_type, score)
    ↓
更新统计数据库
```

---

## 当前数据

| Agent | Task Type | Mean | Variance | Count | Stability |
|-------|-----------|------|----------|-------|-----------|
| DeepSeek V3.2 | analysis | 0.907 | 0.0005 | 3 | stable |
| GLM-5 | analysis | 0.850 | 0.0000 | 1 | stable |
| Qwen3 Coder Plus | coding | 0.960 | 0.0000 | 1 | stable |

---

_版本: 1.0_
_最后更新: 2026-03-22_