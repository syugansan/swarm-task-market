"""
蜂群任务市场 FastAPI 服务

基于 statistical-router.py 实现的任务发布与分配系统
- POST /tasks - 发布任务（包含统计路由分配逻辑）
- GET /tasks - 获取任务列表
- POST /tasks/{id}/claim - 认领任务
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, BackgroundTasks
import statistics

app = FastAPI(title="蜂群任务市场 API", version="1.0.0")

# 任务状态枚举
TASK_STATUS = ['pending', 'claimed', 'completed', 'failed']

# 任务类型
TASK_TYPES = ['analysis', 'coding', 'research', 'writing', 'synthesis', 'review']

# 配置目录
CAPABILITIES_DIR = Path("C:/Users/73829/.openclaw/workspace/agent-capabilities")
TASKS_DIR = Path("D:/蜂群网站项目/蜂群任务市场/backend/tasks")

# 确保目录存在
CAPABILITIES_DIR.mkdir(parents=True, exist_ok=True)
TASKS_DIR.mkdir(parents=True, exist_ok=True)

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    task_type: str = Field(..., description="任务类型: analysis, coding, research, writing, synthesis, review")
    priority: int = Field(default=1, ge=1, le=5)  # 1-5 优先级
    estimated_duration: Optional[int] = None  # 预估完成时间（分钟）
    reward: Optional[float] = None  # 任务奖励

class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    priority: int
    estimated_duration: Optional[int]
    reward: Optional[float]
    status: str
    assigned_agent: Optional[str]
    created_at: str
    updated_at: str
    completed_at: Optional[str]

class ClaimTaskRequest(BaseModel):
    agent_id: str

class RecordPerformanceRequest(BaseModel):
    agent_id: str
    score: float = Field(..., ge=0.0, le=1.0)  # 0.0-1.0 表现评分

class Task:
    def __init__(self, task_create: TaskCreateRequest):
        self.id = str(uuid.uuid4())
        self.title = task_create.title
        self.description = task_create.description
        self.task_type = task_create.task_type
        self.priority = task_create.priority
        self.estimated_duration = task_create.estimated_duration
        self.reward = task_create.reward
        self.status = "pending"
        self.assigned_agent = None
        self.created_at = datetime.utcnow().isoformat() + 'Z'
        self.updated_at = self.created_at
        self.completed_at = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'priority': self.priority,
            'estimated_duration': self.estimated_duration,
            'reward': self.reward,
            'status': self.status,
            'assigned_agent': self.assigned_agent,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'completed_at': self.completed_at
        }
    
    def save(self):
        """保存任务到文件"""
        file_path = TASKS_DIR / f"{self.id}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def load(task_id: str):
        """从文件加载任务"""
        file_path = TASKS_DIR / f"{task_id}.json"
        if not file_path.exists():
            return None
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        task = Task.__new__(Task)
        for key, value in data.items():
            setattr(task, key, value)
        return task

def load_agent(agent_id: str) -> Dict:
    """加载 agent 数据"""
    file_path = CAPABILITIES_DIR / f"{agent_id}.json"
    if not file_path.exists():
        raise FileNotFoundError(f"Agent {agent_id} not found")
    return json.loads(file_path.read_text(encoding='utf-8'))

def save_agent(agent_data: Dict) -> None:
    """保存 agent 数据"""
    agent_id = agent_data['agentId']
    file_path = CAPABILITIES_DIR / f"{agent_id}.json"
    agent_data['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
    file_path.write_text(json.dumps(agent_data, indent=2, ensure_ascii=False), encoding='utf-8')

def record_performance(agent_id: str, task_type: str, score: float, 
                       task_id: Optional[str] = None) -> Dict:
    """
    记录 agent 在某个任务类型上的表现
    
    Args:
        agent_id: Agent ID
        task_type: 任务类型 (analysis/coding/research/...)
        score: 表现分数 (0.0-1.0)
        task_id: 任务ID（可选）
    
    Returns:
        更新后的统计数据
    """
    if task_type not in TASK_TYPES:
        raise ValueError(f"Invalid task type: {task_type}")
    
    if not 0.0 <= score <= 1.0:
        raise ValueError(f"Score must be between 0.0 and 1.0, got {score}")
    
    agent_data = load_agent(agent_id)
    
    # 确保 performance 结构存在
    if 'performance' not in agent_data:
        agent_data['performance'] = {t: {'history': [], 'mean': 0.0, 'variance': 0.0, 'count': 0} 
                                      for t in TASK_TYPES}
    
    # 添加到历史记录
    agent_data['performance'][task_type]['history'].append(score)
    agent_data['totalTasks'] = agent_data.get('totalTasks', 0) + 1
    agent_data['completedTasks'] = agent_data.get('completedTasks', 0) + 1
    
    # 计算统计值
    history = agent_data['performance'][task_type]['history']
    agent_data['performance'][task_type]['mean'] = round(statistics.mean(history), 4)
    agent_data['performance'][task_type]['variance'] = round(
        statistics.variance(history) if len(history) > 1 else 0.0, 6
    )
    agent_data['performance'][task_type]['count'] = len(history)
    
    save_agent(agent_data)
    
    return {
        'agentId': agent_id,
        'taskType': task_type,
        'score': score,
        'newMean': agent_data['performance'][task_type]['mean'],
        'newVariance': agent_data['performance'][task_type]['variance'],
        'count': len(history)
    }

def find_best_agent(task_type: str, alpha: float = 0.5, 
                     min_samples: int = 0, exclude: Optional[List[str]] = None) -> List[Dict]:
    """
    找到最适合某个任务类型的 agent
    
    排序公式：score = mean - alpha * variance
    
    Args:
        task_type: 任务类型
        alpha: 方差惩罚系数（0-1，默认0.5）
        min_samples: 最少历史样本数（默认0，无限制）
        exclude: 排除的 agent ID 列表
    
    Returns:
        排序后的 agent 列表
    """
    if exclude is None:
        exclude = []
    
    results = []
    
    for file_path in CAPABILITIES_DIR.glob('*.json'):
        agent_data = json.loads(file_path.read_text(encoding='utf-8'))
        agent_id = agent_data['agentId']
        
        if agent_id in exclude:
            continue
        
        # 获取该任务类型的性能数据
        if 'performance' not in agent_data:
            continue
        
        perf = agent_data['performance'].get(task_type, {})
        count = perf.get('count', 0)
        
        # 检查最少样本数
        if count < min_samples:
            continue
        
        mean = perf.get('mean', 0.0)
        variance = perf.get('variance', 0.0)
        
        # 计算综合得分
        score = mean - alpha * variance
        
        results.append({
            'agentId': agent_id,
            'agentName': agent_data.get('agentName', agent_id),
            'model': agent_data.get('model', 'unknown'),
            'mean': mean,
            'variance': variance,
            'count': count,
            'score': round(score, 4)
        })
    
    # 按综合得分排序
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results


@app.post("/tasks", response_model=TaskResponse)
async def create_task(task_create: TaskCreateRequest):
    """发布新任务"""
    # 验证任务类型
    if task_create.task_type not in TASK_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid task type: {task_create.task_type}. Valid types: {TASK_TYPES}")
    
    # 创建任务
    task = Task(task_create)
    task.save()
    
    # 使用统计路由找到最佳agent
    try:
        best_agents = find_best_agent(task_create.task_type)
        if best_agents:
            # 自动分配给第一个最佳agent（可选功能）
            best_agent = best_agents[0]
            task.assigned_agent = best_agent['agentId']
            task.status = "claimed"
            task.updated_at = datetime.utcnow().isoformat() + 'Z'
            task.save()
            
            return TaskResponse(**task.to_dict())
        else:
            # 如果没有合适的agent，则保持pending状态
            return TaskResponse(**task.to_dict())
    except Exception as e:
        # 如果路由出错，仍然返回任务（但不分配）
        print(f"Error in statistical routing: {e}")
        return TaskResponse(**task.to_dict())


@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(status: Optional[str] = None, task_type: Optional[str] = None):
    """获取任务列表"""
    tasks = []
    
    for file_path in TASKS_DIR.glob('*.json'):
        with open(file_path, 'r', encoding='utf-8') as f:
            task_data = json.load(f)
        
        # 根据查询参数过滤
        if status and task_data['status'] != status:
            continue
        if task_type and task_data['task_type'] != task_type:
            continue
            
        tasks.append(TaskResponse(**task_data))
    
    # 按创建时间排序（最新的在前）
    tasks.sort(key=lambda x: x.created_at, reverse=True)
    
    return tasks


@app.post("/tasks/{task_id}/claim", response_model=TaskResponse)
async def claim_task(task_id: str, claim_request: ClaimTaskRequest):
    """认领任务"""
    task = Task.load(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != "pending":
        raise HTTPException(status_code=400, detail=f"Task is not pending, current status: {task.status}")
    
    # 验证agent是否存在
    try:
        load_agent(claim_request.agent_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent {claim_request.agent_id} not found")
    
    # 更新任务状态
    task.status = "claimed"
    task.assigned_agent = claim_request.agent_id
    task.updated_at = datetime.utcnow().isoformat() + 'Z'
    task.save()
    
    return TaskResponse(**task.to_dict())


@app.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, performance_request: RecordPerformanceRequest):
    """完成任务并记录表现"""
    task = Task.load(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != "claimed":
        raise HTTPException(status_code=400, detail=f"Task is not claimed, current status: {task.status}")
    
    if task.assigned_agent != performance_request.agent_id:
        raise HTTPException(status_code=400, detail="Agent ID does not match assigned agent")
    
    # 更新任务状态
    task.status = "completed"
    task.completed_at = datetime.utcnow().isoformat() + 'Z'
    task.updated_at = task.updated_at
    task.save()
    
    # 记录表现
    try:
        result = record_performance(
            agent_id=performance_request.agent_id,
            task_type=task.task_type,
            score=performance_request.score,
            task_id=task_id
        )
        
        return {
            "task_id": task_id,
            "agent_id": performance_request.agent_id,
            "status": "completed",
            "performance_record": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording performance: {str(e)}")


@app.get("/agents/{agent_id}/stats")
async def get_agent_stats(agent_id: str):
    """获取 agent 的详细统计信息"""
    try:
        agent_data = load_agent(agent_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    if 'performance' not in agent_data:
        return {
            'agentId': agent_id,
            'agentName': agent_data.get('agentName', agent_id),
            'model': agent_data.get('model', 'unknown'),
            'message': 'No performance data yet',
            'totalTasks': agent_data.get('totalTasks', 0),
            'completedTasks': agent_data.get('completedTasks', 0)
        }
    
    stats = {
        'agentId': agent_id,
        'agentName': agent_data.get('agentName', agent_id),
        'model': agent_data.get('model', 'unknown'),
        'totalTasks': agent_data.get('totalTasks', 0),
        'completedTasks': agent_data.get('completedTasks', 0),
        'failedTasks': agent_data.get('failedTasks', 0),
        'performance': {}
    }
    
    for task_type, perf in agent_data['performance'].items():
        if perf['count'] > 0:
            stats['performance'][task_type] = {
                'mean': perf['mean'],
                'variance': perf['variance'],
                'count': perf['count'],
                'stability': 'high' if perf['variance'] < 0.01 else ('medium' if perf['variance'] < 0.05 else 'low')
            }
    
    return stats


@app.get("/best-agent/{task_type}")
async def get_best_agent(task_type: str, alpha: float = 0.5, min_samples: int = 0):
    """获取最适合某种任务类型的agent"""
    if task_type not in TASK_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid task type: {task_type}. Valid types: {TASK_TYPES}")
    
    results = find_best_agent(task_type, alpha, min_samples)
    
    if not results:
        raise HTTPException(status_code=404, detail=f"No agents with sufficient data for {task_type}")
    
    return {
        "task_type": task_type,
        "alpha": alpha,
        "min_samples": min_samples,
        "best_agents": results[:5]  # 返回前5名
    }


@app.get("/")
async def root():
    """健康检查"""
    return {
        "message": "蜂群任务市场 API",
        "version": "1.0.0",
        "capabilities_dir": str(CAPABILITIES_DIR),
        "tasks_dir": str(TASKS_DIR),
        "task_types": TASK_TYPES
    }