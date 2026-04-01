"""
Task Decomposition 系统 v2.1

核心组件：
1. 任务拆解器（带粒度控制）
2. 能力路由器
3. 依赖调度器

粒度黄金法则：每个子任务 1-5 分钟
"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from collections import defaultdict
import statistics

# 时间常量（分钟）
MIN_SUBTASK_TIME = 1.0
MAX_SUBTASK_TIME = 5.0
OPTIMAL_TIME_RANGE = (2.0, 4.0)

# 能力标签定义
CAPABILITIES = [
    'api_design',      # API设计
    'type_definition', # 类型定义
    'business_logic',  # 业务逻辑
    'error_handling',  # 错误处理
    'testing',         # 测试用例
    'documentation',   # 文档注释
    'analysis',        # 分析推理
    'summarization',   # 总结归纳
    'translation',     # 翻译
    'code_review',     # 代码审查
    'optimization',    # 性能优化
    'security',        # 安全检查
    'deployment',      # 服务部署
    'devops',          # 运维配置
    'debugging',       # 问题诊断
]

# 任务类型到能力标签的映射
TASK_TYPE_CAPABILITIES = {
    'coding': ['api_design', 'type_definition', 'business_logic', 'error_handling', 'testing', 'documentation'],
    'analysis': ['analysis', 'summarization'],
    'review': ['code_review', 'security', 'optimization'],
    'documentation': ['documentation', 'summarization'],
    'testing': ['testing', 'error_handling'],
    'deployment': ['deployment', 'devops', 'debugging', 'security'],    # 新增：部署任务
    'devops': ['devops', 'deployment', 'debugging', 'optimization'],    # 新增：运维任务
}

# 默认能力矩阵（基于历史表现）
DEFAULT_CAPABILITY_MATRIX = {
    'deepseek-v3.2': {
        'api_design': (0.92, 0.01),
        'type_definition': (0.85, 0.02),
        'business_logic': (0.88, 0.015),
        'error_handling': (0.90, 0.01),
        'testing': (0.82, 0.02),
        'documentation': (0.80, 0.025),
        'analysis': (0.907, 0.0005),
        'summarization': (0.88, 0.01),
        'code_review': (0.85, 0.02),
        'optimization': (0.87, 0.015),
        'security': (0.82, 0.02),
        'translation': (0.75, 0.03),
        'deployment': (0.90, 0.01),    # 部署能力强
        'devops': (0.88, 0.015),       # 运维能力不错
        'debugging': (0.92, 0.01),     # 调试能力强
    },
    'qwen3-coder-plus': {
        'api_design': (0.85, 0.015),
        'type_definition': (0.95, 0.005),
        'business_logic': (0.96, 0.00025),
        'error_handling': (0.88, 0.02),
        'testing': (0.90, 0.01),
        'documentation': (0.92, 0.005),
        'analysis': (0.80, 0.02),
        'summarization': (0.82, 0.02),
        'code_review': (0.88, 0.015),
        'optimization': (0.85, 0.02),
        'security': (0.78, 0.025),
        'translation': (0.70, 0.03),
        'deployment': (0.88, 0.015),    # 部署能力不错
        'devops': (0.85, 0.02),         # 运维能力可以
        'debugging': (0.90, 0.01),      # 调试能力强
    },
    'claude': {
        'api_design': (0.88, 0.01),
        'type_definition': (0.90, 0.01),
        'business_logic': (0.85, 0.02),
        'error_handling': (0.92, 0.01),
        'testing': (0.95, 0.005),
        'documentation': (0.88, 0.015),
        'analysis': (0.90, 0.01),
        'summarization': (0.92, 0.005),
        'code_review': (0.93, 0.008),
        'optimization': (0.88, 0.012),
        'security': (0.90, 0.01),
        'translation': (0.85, 0.02),
        'deployment': (0.85, 0.015),    # 部署能力不错
        'devops': (0.88, 0.012),        # 运维能力强
        'debugging': (0.90, 0.01),      # 调试能力强
    },
    'glm-5': {
        'api_design': (0.80, 0.02),
        'type_definition': (0.82, 0.02),
        'business_logic': (0.80, 0.02),
        'error_handling': (0.78, 0.025),
        'testing': (0.75, 0.03),
        'documentation': (0.85, 0.02),
        'analysis': (0.85, 0.0000),
        'summarization': (0.83, 0.015),
        'code_review': (0.78, 0.025),
        'optimization': (0.75, 0.03),
        'security': (0.72, 0.035),
        'translation': (0.88, 0.01),
        'deployment': (0.70, 0.04),     # 部署能力弱
        'devops': (0.68, 0.045),        # 运维能力弱
        'debugging': (0.72, 0.035),     # 调试能力一般
    },
}


@dataclass
class SubTask:
    """子任务结构"""
    id: str
    parent_task_id: str
    capability: str
    description: str
    dependencies: List[str]
    estimated_time: float = 2.0  # 预估时间（分钟）
    status: str = 'pending'
    assigned_agent: Optional[str] = None
    result: Optional[dict] = None
    score: Optional[float] = None


class GranularityChecker:
    """粒度检查器 - 确保每个子任务在1-5分钟范围内"""
    
    # 能力预估时间（分钟）
    CAPABILITY_TIME_ESTIMATES = {
        'api_design': 2.5,
        'type_definition': 1.5,
        'business_logic': 4.0,
        'error_handling': 2.0,
        'testing': 3.0,
        'documentation': 1.5,
        'analysis': 3.0,
        'summarization': 2.0,
        'translation': 2.0,
        'code_review': 2.5,
        'optimization': 3.0,
        'security': 2.5,
        'deployment': 4.0,    # 部署任务较长
        'devops': 3.5,        # 运维配置
        'debugging': 3.0,     # 问题诊断
    }
    
    def estimate_time(self, capability: str) -> float:
        """预估子任务执行时间"""
        return self.CAPABILITY_TIME_ESTIMATES.get(capability, 2.0)
    
    def check_granularity(self, subtask: SubTask) -> dict:
        """
        检查粒度是否最优
        
        Returns:
            {
                'status': 'optimal' | 'too_fine' | 'too_coarse',
                'estimated_time': float,
                'suggestion': str
            }
        """
        time = subtask.estimated_time
        
        if time < MIN_SUBTASK_TIME:
            return {
                'status': 'too_fine',
                'estimated_time': time,
                'suggestion': f"粒度过细（{time:.1f}分钟 < 1分钟），建议合并到相邻任务"
            }
        elif time > MAX_SUBTASK_TIME:
            return {
                'status': 'too_coarse',
                'estimated_time': time,
                'suggestion': f"粒度过粗（{time:.1f}分钟 > 5分钟），建议继续拆分"
            }
        else:
            return {
                'status': 'optimal',
                'estimated_time': time,
                'suggestion': f"粒度最优（{time:.1f}分钟在1-5分钟范围内）"
            }
    
    def suggest_merge(self, subtasks: List[SubTask]) -> List[List[str]]:
        """建议合并的子任务组"""
        merge_groups = []
        fine_tasks = [s for s in subtasks if s.estimated_time < MIN_SUBTASK_TIME]
        
        for i in range(0, len(fine_tasks), 2):
            if i + 1 < len(fine_tasks):
                merge_groups.append([fine_tasks[i].id, fine_tasks[i+1].id])
            elif merge_groups:
                merge_groups[-1].append(fine_tasks[i].id)
        
        return merge_groups


class TaskDecomposer:
    """任务拆解器"""
    
    # 任务拆解模板
    DECOMPOSITION_TEMPLATES = {
        'coding': [
            {'capability': 'api_design', 'description': '设计API接口和架构', 'depends_on': []},
            {'capability': 'type_definition', 'description': '定义数据类型和接口', 'depends_on': []},
            {'capability': 'business_logic', 'description': '实现核心业务逻辑', 'depends_on': ['api_design', 'type_definition']},
            {'capability': 'error_handling', 'description': '添加错误处理逻辑', 'depends_on': ['business_logic']},
            {'capability': 'testing', 'description': '编写测试用例', 'depends_on': ['business_logic']},
            {'capability': 'documentation', 'description': '编写文档注释', 'depends_on': ['business_logic']},
        ],
        'analysis': [
            {'capability': 'analysis', 'description': '分析问题和收集信息', 'depends_on': []},
            {'capability': 'summarization', 'description': '总结分析结果', 'depends_on': ['analysis']},
        ],
        'review': [
            {'capability': 'code_review', 'description': '审查代码质量', 'depends_on': []},
            {'capability': 'security', 'description': '检查安全问题', 'depends_on': []},
            {'capability': 'optimization', 'description': '优化建议', 'depends_on': ['code_review']},
        ],
        'deployment': [
            {'capability': 'deployment', 'description': '配置服务器环境', 'depends_on': []},
            {'capability': 'devops', 'description': '安装依赖和配置', 'depends_on': ['deployment']},
            {'capability': 'security', 'description': '配置安全策略', 'depends_on': ['devops']},
            {'capability': 'debugging', 'description': '验证部署结果', 'depends_on': ['devops', 'security']},
        ],
        'devops': [
            {'capability': 'devops', 'description': '配置基础设施', 'depends_on': []},
            {'capability': 'deployment', 'description': '部署应用服务', 'depends_on': ['devops']},
            {'capability': 'debugging', 'description': '诊断和解决问题', 'depends_on': ['deployment']},
            {'capability': 'optimization', 'description': '性能优化配置', 'depends_on': ['deployment']},
        ],
    }
    
    def decompose(self, task_id: str, task_type: str, task_description: str) -> List[SubTask]:
        """
        拆解任务为子任务
        
        Args:
            task_id: 父任务ID
            task_type: 任务类型
            task_description: 任务描述
            
        Returns:
            子任务列表
        """
        template = self.DECOMPOSITION_TEMPLATES.get(task_type, [])
        if not template:
            # 如果没有模板，返回单个任务
            return [SubTask(
                id=f"{task_id}_0",
                parent_task_id=task_id,
                capability='analysis',
                description=task_description,
                dependencies=[]
            )]
        
        subtasks = []
        id_map = {}  # capability -> subtask_id
        granularity_checker = GranularityChecker()
        
        for i, item in enumerate(template):
            subtask_id = f"{task_id}_{i}"
            id_map[item['capability']] = subtask_id
            
            # 解析依赖
            dependencies = []
            for dep_cap in item['depends_on']:
                if dep_cap in id_map:
                    dependencies.append(id_map[dep_cap])
            
            # 预估执行时间
            estimated_time = granularity_checker.estimate_time(item['capability'])
            
            subtasks.append(SubTask(
                id=subtask_id,
                parent_task_id=task_id,
                capability=item['capability'],
                description=f"{item['description']}: {task_description}",
                dependencies=dependencies,
                estimated_time=estimated_time
            ))
        
        return subtasks


class CapabilityRouter:
    """能力路由器"""
    
    def __init__(self, alpha: float = 0.5, min_samples: int = 1):
        """
        Args:
            alpha: 方差惩罚系数
            min_samples: 最小样本数
        """
        self.alpha = alpha
        self.min_samples = min_samples
        self.matrix = DEFAULT_CAPABILITY_MATRIX
    
    def route(self, capability: str, exclude_agents: List[str] = None) -> str:
        """
        根据能力路由到最佳模型
        
        Args:
            capability: 能力标签
            exclude_agents: 排除的模型列表（避免重复分配）
            
        Returns:
            最佳模型ID
        """
        exclude_agents = exclude_agents or []
        
        scored = []
        for agent_id, capabilities in self.matrix.items():
            if agent_id in exclude_agents:
                continue
            
            if capability not in capabilities:
                continue
            
            mean, variance = capabilities[capability]
            score = mean - self.alpha * variance
            scored.append((agent_id, score))
        
        if not scored:
            # 没有可用模型，返回默认
            return 'deepseek-v3.2'
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[0][0]
    
    def route_batch(self, subtasks: List[SubTask]) -> Dict[str, str]:
        """
        批量路由，避免同一波次重复分配
        
        Args:
            subtasks: 子任务列表（同一波次）
            
        Returns:
            子任务ID -> 模型ID 映射
        """
        assignments = {}
        assigned_agents = []
        
        for subtask in subtasks:
            agent = self.route(subtask.capability, exclude_agents=assigned_agents)
            assignments[subtask.id] = agent
            assigned_agents.append(agent)
        
        return assignments
    
    def update_capability(self, agent_id: str, capability: str, score: float):
        """
        更新能力矩阵
        
        Args:
            agent_id: 模型ID
            capability: 能力标签
            score: 分数 (0-1)
        """
        if agent_id not in self.matrix:
            self.matrix[agent_id] = {}
        
        if capability not in self.matrix[agent_id]:
            self.matrix[agent_id][capability] = (score, 0)
            return
        
        old_mean, old_var = self.matrix[agent_id][capability]
        
        # 更新均值和方差（简化版本）
        # 实际应该存储所有分数，计算真实方差
        new_mean = (old_mean + score) / 2
        new_var = abs(score - old_mean) / 2  # 近似方差
        
        self.matrix[agent_id][capability] = (new_mean, new_var)


class DependencyScheduler:
    """依赖调度器"""
    
    def schedule(self, subtasks: List[SubTask]) -> List[List[SubTask]]:
        """
        调度子任务，返回执行波次
        
        Args:
            subtasks: 子任务列表
            
        Returns:
            执行波次列表（每波次内的任务可以并行）
        """
        # 构建ID到任务的映射
        task_map = {s.id: s for s in subtasks}
        
        # 计算入度
        in_degree = {s.id: 0 for s in subtasks}
        for s in subtasks:
            for dep in s.dependencies:
                if dep in in_degree:
                    in_degree[s.id] += 1
        
        # 波次划分
        waves = []
        completed = set()
        remaining = set(s.id for s in subtasks)
        
        while remaining:
            # 找出入度为0的任务
            wave = []
            for sid in list(remaining):
                # 检查所有依赖是否已完成
                task = task_map[sid]
                all_deps_done = all(d in completed for d in task.dependencies)
                if all_deps_done:
                    wave.append(task)
            
            if not wave:
                # 存在循环依赖或外部依赖
                # 把剩余任务都放入下一波
                for sid in remaining:
                    wave.append(task_map[sid])
            
            waves.append(wave)
            for t in wave:
                completed.add(t.id)
                remaining.discard(t.id)
        
        return waves


class FineRouter:
    """细粒度路由系统"""
    
    def __init__(self):
        self.decomposer = TaskDecomposer()
        self.router = CapabilityRouter()
        self.scheduler = DependencyScheduler()
    
    def process_task(self, task_id: str, task_type: str, task_description: str) -> dict:
        """
        处理完整任务（Task Decomposition）
        
        Args:
            task_id: 任务ID
            task_type: 任务类型
            task_description: 任务描述
            
        Returns:
            执行计划（含粒度分析）
        """
        # 1. 拆解任务
        subtasks = self.decomposer.decompose(task_id, task_type, task_description)
        
        # 2. 粒度检查
        granularity_checker = GranularityChecker()
        granularity_report = []
        for s in subtasks:
            check = granularity_checker.check_granularity(s)
            granularity_report.append({
                'subtask_id': s.id,
                'capability': s.capability,
                'estimated_time': check['estimated_time'],
                'status': check['status'],
                'suggestion': check['suggestion']
            })
        
        # 3. 调度波次
        waves = self.scheduler.schedule(subtasks)
        
        # 4. 路由每波次的任务
        execution_plan = []
        total_parallel_time = 0
        
        for wave_idx, wave in enumerate(waves):
            assignments = self.router.route_batch(wave)
            wave_time = max(s.estimated_time for s in wave)  # 波次时间 = 最长子任务
            total_parallel_time += wave_time
            
            execution_plan.append({
                'wave': wave_idx + 1,
                'estimated_time': wave_time,
                'subtasks': [
                    {
                        'id': s.id,
                        'capability': s.capability,
                        'description': s.description,
                        'estimated_time': s.estimated_time,
                        'assigned_agent': assignments[s.id]
                    }
                    for s in wave
                ]
            })
        
        # 5. 计算加速比
        serial_time = sum(s.estimated_time for s in subtasks)
        speedup = serial_time / total_parallel_time if total_parallel_time > 0 else 1.0
        
        return {
            'task_id': task_id,
            'task_type': task_type,
            'total_subtasks': len(subtasks),
            'total_waves': len(waves),
            'serial_time': f"{serial_time:.1f}分钟",
            'parallel_time': f"{total_parallel_time:.1f}分钟",
            'speedup': f"{speedup:.2f}x",
            'granularity_report': granularity_report,
            'execution_plan': execution_plan
        }
    
    def record_performance(self, subtask_id: str, agent_id: str, capability: str, score: float):
        """
        记录子任务表现
        
        Args:
            subtask_id: 子任务ID
            agent_id: 模型ID
            capability: 能力标签
            score: 分数 (0-1)
        """
        self.router.update_capability(agent_id, capability, score)
    
    def get_capability_matrix(self) -> dict:
        """获取当前能力矩阵"""
        return self.router.matrix


# 使用示例
if __name__ == '__main__':
    router = FineRouter()
    
    # 测试编码任务
    plan = router.process_task(
        task_id='task_001',
        task_type='coding',
        task_description='开发一个用户登录API'
    )
    
    print("执行计划:")
    print(json.dumps(plan, indent=2, ensure_ascii=False))
    
    print("\n能力矩阵:")
    matrix = router.get_capability_matrix()
    for agent, caps in matrix.items():
        print(f"\n{agent}:")
        for cap, (mean, var) in caps.items():
            score = mean - 0.5 * var
            print(f"  {cap}: mean={mean:.3f}, var={var:.4f}, score={score:.3f}")