# Task Decomposition 系统设计

_细粒度路由系统 v2.0_

---

## 正式概念

**Task Decomposition（任务分解）** 是蜂群协作的核心技术，通过将大任务拆解成专注的子任务，让每个模型只做自己最擅长的部分。

### 核心原则

```
一个大任务
    ↓ 拆解（Decomposition）
子任务A（分析）→ DeepSeek V3.2（分析强）
子任务B（编码）→ Qwen3 Coder Plus（编码强）
子任务C（验证）→ GLM-5（成本低）
    ↓ 合并（Merge）
最终结果
```

### 粒度控制（关键！）

| 粒度 | 问题 | 效果 |
|------|------|------|
| **太粗** | 一个模型做太多 | 失去并行优势 |
| **太细** | overhead 太大 | 合并成本高 |
| **最佳** | 每个子任务 1-5 分钟 | 模型专注 + 并行加速 |

---

## 系统对比

### v1.0 粗粒度
```
任务 → task_type → 单个模型执行全部
```

### v2.0 Task Decomposition
```
任务 → 拆解成子任务（1-5分钟）→ 每个子任务路由到最擅长模型 → 并行执行 → 合并结果
```

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     任务入口                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   1. 任务拆解器                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 大任务 → 子任务列表（带依赖关系）                         │ │
│  │                                                          │ │
│  │ 例如：编码任务                                           │ │
│  │ ├── 子任务1: API设计（无依赖）                           │ │
│  │ ├── 子任务2: 类型定义（无依赖）                          │ │
│  │ ├── 子任务3: 业务逻辑（依赖1,2）                         │ │
│  │ ├── 子任务4: 错误处理（依赖3）                           │ │
│  │ ├── 子任务5: 测试用例（依赖3）                           │ │
│  │ └── 子任务6: 文档注释（依赖3）                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   2. 能力标签路由                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 每个子任务 → 能力标签 → 最佳模型                          │ │
│  │                                                          │ │
│  │ 能力标签矩阵（动态统计）:                                 │ │
│  │                                                          │ │
│  │           │ API设计 │ 类型 │ 逻辑 │ 错误 │ 测试 │ 文档 │  │
│  │ ──────────┼────────┼──────┼──────┼──────┼──────┼──────│  │
│  │ DeepSeek  │ 0.92   │ 0.85 │ 0.88 │ 0.90 │ 0.82 │ 0.80 │  │
│  │ Qwen3     │ 0.85   │ 0.95 │ 0.96 │ 0.88 │ 0.90 │ 0.92 │  │
│  │ Claude    │ 0.88   │ 0.90 │ 0.85 │ 0.92 │ 0.95 │ 0.88 │  │
│  │ GLM-5     │ 0.80   │ 0.82 │ 0.80 │ 0.78 │ 0.75 │ 0.85 │  │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   3. 依赖图调度                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 分析依赖关系 → 并行执行无依赖任务 → 串行执行依赖任务      │ │
│  │                                                          │ │
│  │ 第一波（并行）: 子任务1, 子任务2                          │ │
│  │ 第二波（并行）: 子任务3                                   │ │
│  │ 第三波（并行）: 子任务4, 子任务5, 子任务6                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   4. 结果合并                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 收集所有子任务结果 → 验证完整性 → 合并输出                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 数据结构

### 子任务结构
```typescript
interface SubTask {
  id: string;
  parent_task_id: string;
  capability: string;        // 能力标签
  description: string;
  dependencies: string[];    // 依赖的子任务ID
  status: 'pending' | 'running' | 'completed' | 'failed';
  assigned_agent: string;
  result?: any;
  score?: number;
}
```

### 能力标签
```typescript
type Capability = 
  | 'api_design'      // API设计
  | 'type_definition' // 类型定义
  | 'business_logic'  // 业务逻辑
  | 'error_handling'  // 错误处理
  | 'testing'         // 测试用例
  | 'documentation'   // 文档注释
  | 'analysis'        // 分析推理
  | 'summarization'   // 总结归纳
  | 'translation'     // 翻译
  | 'code_review'     // 代码审查
  | 'optimization'    // 性能优化
  | 'security'        // 安全检查
  ;
```

### 能力矩阵
```typescript
interface CapabilityMatrix {
  agent_id: string;
  capabilities: {
    [key in Capability]?: {
      mean: number;
      variance: number;
      count: number;
      last_updated: string;
    };
  };
}
```

---

## 路由算法

### 1. 任务拆解
```python
def decompose_task(task_description: str) -> List[SubTask]:
    """
    使用 LLM 将任务拆解成子任务
    
    输入: "开发一个用户登录API"
    输出: [
        SubTask(capability='api_design', dependencies=[]),
        SubTask(capability='type_definition', dependencies=[]),
        SubTask(capability='business_logic', dependencies=['api_design', 'type_definition']),
        SubTask(capability='error_handling', dependencies=['business_logic']),
        SubTask(capability='testing', dependencies=['business_logic']),
        SubTask(capability='documentation', dependencies=['business_logic'])
    ]
    """
    pass
```

### 2. 能力路由
```python
def route_by_capability(capability: str) -> str:
    """
    根据能力标签找最佳模型
    
    公式: score = mean - α * variance
    """
    agents = get_capability_matrix(capability)
    
    scored = []
    for agent in agents:
        cap_data = agent['capabilities'].get(capability)
        if cap_data and cap_data['count'] >= MIN_SAMPLES:
            score = cap_data['mean'] - ALPHA * cap_data['variance']
            scored.append((agent['agent_id'], score))
    
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0][0] if scored else DEFAULT_AGENT
```

### 3. 依赖调度
```python
def schedule_subtasks(subtasks: List[SubTask]) -> List[List[SubTask]]:
    """
    拓扑排序 + 波次划分
    
    返回: [
        [子任务1, 子任务2],     # 第一波（并行）
        [子任务3],             # 第二波
        [子任务4, 子任务5, 子任务6]  # 第三波
    ]
    """
    waves = []
    completed = set()
    remaining = set(s.id for s in subtasks)
    
    while remaining:
        # 找出所有依赖已满足的任务
        wave = []
        for sid in list(remaining):
            task = get_subtask(sid)
            if all(d in completed for d in task.dependencies):
                wave.append(task)
        
        if not wave:
            raise Exception("存在循环依赖")
        
        waves.append(wave)
        for t in wave:
            completed.add(t.id)
            remaining.remove(t.id)
    
    return waves
```

---

## 数据库扩展

### 新增表: capability_matrix
```sql
CREATE TABLE capability_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    mean FLOAT NOT NULL DEFAULT 0,
    variance FLOAT NOT NULL DEFAULT 0,
    count INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, capability)
);
```

### 新增表: subtasks
```sql
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id UUID REFERENCES tasks(id),
    capability TEXT NOT NULL,
    description TEXT,
    dependencies UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    assigned_agent TEXT,
    result JSONB,
    score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## 初始能力矩阵

| Agent | api_design | type_def | logic | error | testing | docs |
|-------|------------|----------|-------|-------|---------|------|
| DeepSeek V3.2 | 0.92 | 0.85 | 0.88 | 0.90 | 0.82 | 0.80 |
| Qwen3 Coder Plus | 0.85 | 0.95 | 0.96 | 0.88 | 0.90 | 0.92 |
| Claude | 0.88 | 0.90 | 0.85 | 0.92 | 0.95 | 0.88 |
| GLM-5 | 0.80 | 0.82 | 0.80 | 0.78 | 0.75 | 0.85 |

**数据来源**:
- 基于历史表现统计
- 定期校准
- 新模型初始化为 0.5

---

## 粒度控制指南

### 黄金法则
> **每个子任务 1-5 分钟，模型专注自己擅长的部分**

### 判断标准

```python
def is_optimal_granularity(subtask):
    """判断粒度是否最优"""
    
    # 1. 时间检查
    estimated_time = estimate_execution_time(subtask)
    if estimated_time < 1 * MINUTE:
        return "太细，合并到相邻任务"
    if estimated_time > 5 * MINUTE:
        return "太粗，继续拆分"
    
    # 2. 能力检查
    if has_multiple_capabilities(subtask):
        return "太粗，按能力拆分"
    
    # 3. 依赖检查
    if has_complex_dependencies(subtask):
        return "可能太细，考虑合并"
    
    return "最优粒度"
```

### 实际案例

**编码任务分解示例**：

| 子任务 | 预估时间 | 能力 | 最佳模型 | 粒度评价 |
|--------|---------|------|---------|---------|
| API设计 | 2分钟 | api_design | DeepSeek V3.2 | ✅ 最优 |
| 类型定义 | 1分钟 | type_definition | Qwen3 Coder | ✅ 最优 |
| 业务逻辑 | 4分钟 | business_logic | Qwen3 Coder | ✅ 最优 |
| 错误处理 | 2分钟 | error_handling | Claude | ✅ 最优 |
| 测试用例 | 3分钟 | testing | Claude | ✅ 最优 |
| 文档注释 | 1分钟 | documentation | Qwen3 Coder | ⚠️ 可合并 |

### 合并策略

**可以合并的情况**：
1. 时间 < 1分钟的相邻任务
2. 同一模型负责的连续任务
3. 低依赖的任务

**不应该合并的情况**：
1. 不同能力要求的任务
2. 适合不同模型的任务
3. 高独立性的任务

---

## 性能指标

| 指标 | v1.0 粗粒度 | v2.0 Task Decomposition |
|------|------------|------------------------|
| 任务成功率 | 85% | 预计 92%+ |
| 平均质量分 | 0.88 | 预计 0.93+ |
| 执行时间 | 串行（15分钟） | 并行（5分钟） |
| 资源利用率 | 单模型 100% | 多模型各 20-40% |
| 合并成本 | 无 | 约 5% overhead |

---

_版本: 2.1_
_设计时间: 2026-03-23_
_更新: 纳入 Task Decomposition 最佳实践_