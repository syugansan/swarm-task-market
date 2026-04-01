"""
蜂群任务市场 API v2 - Task Decomposition

新增功能：
- POST /tasks - 发布任务（自动拆解成子任务）
- GET /tasks/{id}/plan - 获取执行计划
- POST /subtasks/{id}/complete - 完成子任务
- GET /capability-matrix - 获取能力矩阵
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
import sys
sys.path.append(str(Path(__file__).parent.parent))
from fine_router import FineRouter, SubTask, GranularityChecker

app = FastAPI(title="蜂群任务市场 API v2", version="2.0.0")

# 配置目录
TASKS_DIR = Path("D:/蜂群网站项目/蜂群任务市场/backend/tasks_v2")
SUBTASKS_DIR = Path("D:/蜂群网站项目/蜂群任务市场/backend/subtasks")

# 确保目录存在
TASKS_DIR.mkdir(parents=True, exist_ok=True)
SUBTASKS_DIR.mkdir(parents=True, exist_ok=True)

# 初始化路由器
router = FineRouter()


# ========== 请求/响应模型 ==========

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    task_type: str = Field(..., description="任务类型: coding, analysis, review")
    auto_decompose: bool = Field(default=True, description="是否自动拆解")


class SubTaskResponse(BaseModel):
    id: str
    parent_task_id: str
    capability: str
    description: str
    estimated_time: float
    status: str
    assigned_agent: Optional[str]
    wave: int


class TaskPlanResponse(BaseModel):
    task_id: str
    task_type: str
    total_subtasks: int
    total_waves: int
    serial_time: str
    parallel_time: str
    speedup: str
    execution_plan: List[dict]


class CompleteSubTaskRequest(BaseModel):
    agent_id: str
    score: float = Field(..., ge=0.0, le=1.0)
    result: Optional[str] = None


# ========== 核心逻辑 ==========

class TaskV2:
    """支持 Task Decomposition 的任务"""
    
    def __init__(self, task_create: TaskCreateRequest):
        self.id = str(uuid.uuid4())
        self.title = task_create.title
        self.description = task_create.description
        self.task_type = task_create.task_type
        self.status = "pending"
        self.created_at = datetime.utcnow().isoformat() + 'Z'
        self.updated_at = self.created_at
        self.subtask_ids: List[str] = []
        self.execution_plan: Optional[dict] = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'subtask_ids': self.subtask_ids,
            'execution_plan': self.execution_plan
        }
    
    def save(self):
        file_path = TASKS_DIR / f"{self.id}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def load(task_id: str):
        file_path = TASKS_DIR / f"{task_id}.json"
        if not file_path.exists():
            return None
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        task = TaskV2.__new__(TaskV2)
        for key, value in data.items():
            setattr(task, key, value)
        return task


def save_subtask(subtask: SubTask, wave: int, assigned_agent: str):
    """保存子任务"""
    data = {
        'id': subtask.id,
        'parent_task_id': subtask.parent_task_id,
        'capability': subtask.capability,
        'description': subtask.description,
        'estimated_time': subtask.estimated_time,
        'dependencies': subtask.dependencies,
        'status': subtask.status,
        'assigned_agent': assigned_agent,
        'wave': wave,
        'result': None,
        'score': None,
        'created_at': datetime.utcnow().isoformat() + 'Z',
        'completed_at': None
    }
    
    file_path = SUBTASKS_DIR / f"{subtask.id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_subtask(subtask_id: str) -> Optional[dict]:
    """加载子任务"""
    file_path = SUBTASKS_DIR / f"{subtask_id}.json"
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ========== API 端点 ==========

@app.post("/tasks")
async def create_task(task_create: TaskCreateRequest):
    """发布任务（支持 Task Decomposition）"""
    
    # 创建任务
    task = TaskV2(task_create)
    
    if task_create.auto_decompose:
        # 执行 Task Decomposition
        plan = router.process_task(
            task_id=task.id,
            task_type=task_create.task_type,
            task_description=task_create.description
        )
        
        # 保存执行计划
        task.execution_plan = plan
        
        # 保存所有子任务
        for wave_data in plan['execution_plan']:
            wave = wave_data['wave']
            for st in wave_data['subtasks']:
                subtask = SubTask(
                    id=st['id'],
                    parent_task_id=task.id,
                    capability=st['capability'],
                    description=st['description'],
                    dependencies=[],
                    estimated_time=st['estimated_time']
                )
                save_subtask(subtask, wave, st['assigned_agent'])
                task.subtask_ids.append(st['id'])
        
        task.status = "decomposed"
    
    task.save()
    
    return {
        "task": task.to_dict(),
        "decomposed": task_create.auto_decompose,
        "subtask_count": len(task.subtask_ids)
    }


@app.get("/tasks/{task_id}/plan", response_model=TaskPlanResponse)
async def get_task_plan(task_id: str):
    """获取任务的执行计划"""
    task = TaskV2.load(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.execution_plan:
        raise HTTPException(status_code=400, detail="Task not decomposed")
    
    return TaskPlanResponse(**task.execution_plan)


@app.get("/tasks/{task_id}/subtasks")
async def get_task_subtasks(task_id: str):
    """获取任务的所有子任务"""
    task = TaskV2.load(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtasks = []
    for sid in task.subtask_ids:
        st = load_subtask(sid)
        if st:
            subtasks.append(st)
    
    return {
        "task_id": task_id,
        "total": len(subtasks),
        "subtasks": subtasks
    }


@app.post("/subtasks/{subtask_id}/complete")
async def complete_subtask(subtask_id: str, request: CompleteSubTaskRequest):
    """完成子任务"""
    st = load_subtask(subtask_id)
    if not st:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    if st['status'] == 'completed':
        raise HTTPException(status_code=400, detail="Subtask already completed")
    
    # 更新子任务状态
    st['status'] = 'completed'
    st['completed_at'] = datetime.utcnow().isoformat() + 'Z'
    st['score'] = request.score
    st['result'] = request.result
    
    # 保存
    file_path = SUBTASKS_DIR / f"{subtask_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(st, f, ensure_ascii=False, indent=2)
    
    # 更新能力矩阵
    router.record_performance(
        subtask_id=subtask_id,
        agent_id=request.agent_id,
        capability=st['capability'],
        score=request.score
    )
    
    # 检查父任务是否完成
    task = TaskV2.load(st['parent_task_id'])
    if task:
        all_completed = True
        for sid in task.subtask_ids:
            sibling = load_subtask(sid)
            if sibling and sibling['status'] != 'completed':
                all_completed = False
                break
        
        if all_completed:
            task.status = 'completed'
            task.updated_at = datetime.utcnow().isoformat() + 'Z'
            task.save()
    
    return {
        "subtask_id": subtask_id,
        "status": "completed",
        "score": request.score,
        "capability_matrix_updated": True
    }


@app.get("/capability-matrix")
async def get_capability_matrix():
    """获取当前能力矩阵"""
    matrix = router.get_capability_matrix()
    
    # 格式化输出
    result = {}
    for agent_id, capabilities in matrix.items():
        result[agent_id] = {}
        for cap, (mean, var) in capabilities.items():
            score = mean - 0.5 * var
            result[agent_id][cap] = {
                'mean': round(mean, 3),
                'variance': round(var, 4),
                'score': round(score, 3),
                'stability': 'high' if var < 0.01 else ('medium' if var < 0.05 else 'low')
            }
    
    return result


@app.get("/capability-matrix/{agent_id}")
async def get_agent_capabilities(agent_id: str):
    """获取指定 agent 的能力"""
    matrix = router.get_capability_matrix()
    
    if agent_id not in matrix:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    capabilities = matrix[agent_id]
    result = {}
    
    for cap, (mean, var) in capabilities.items():
        score = mean - 0.5 * var
        result[cap] = {
            'mean': round(mean, 3),
            'variance': round(var, 4),
            'score': round(score, 3)
        }
    
    # 找出最强能力
    best = max(result.items(), key=lambda x: x[1]['score'])
    
    return {
        "agent_id": agent_id,
        "capabilities": result,
        "best_capability": best[0],
        "best_score": best[1]['score']
    }


@app.get("/tasks")
async def list_tasks(status: Optional[str] = None):
    """列出所有任务"""
    tasks = []
    
    for file_path in TASKS_DIR.glob('*.json'):
        with open(file_path, 'r', encoding='utf-8') as f:
            task_data = json.load(f)
        
        if status and task_data['status'] != status:
            continue
        
        # 计算子任务进度
        completed = sum(
            1 for sid in task_data['subtask_ids']
            if load_subtask(sid) and load_subtask(sid)['status'] == 'completed'
        )
        
        task_data['progress'] = {
            'completed': completed,
            'total': len(task_data['subtask_ids'])
        }
        
        tasks.append(task_data)
    
    tasks.sort(key=lambda x: x['created_at'], reverse=True)
    
    return tasks


@app.get("/")
async def root():
    """健康检查"""
    return {
        "message": "蜂群任务市场 API v2 - Task Decomposition",
        "version": "2.0.0",
        "features": [
            "Task Decomposition",
            "Capability-based Routing",
            "Parallel Execution",
            "Granularity Control"
        ]
    }