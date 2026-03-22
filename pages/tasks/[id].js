import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export async function getServerSideProps(context) {
  const { id } = context.params
  
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_id', id)
    .single()
  
  if (error || !task) {
    return {
      notFound: true
    }
  }

  return { props: { task } }
}

export default function TaskDetail({ task }) {
  const router = useRouter()

  const handleClaim = () => {
    alert('功能开发中，敬请期待！')
  }

  const difficultyColors = {
    'EASY': '#4CAF50',
    'MEDIUM': '#FF9800',
    'HARD': '#F44336'
  }

  const typeLabels = {
    'analysis': '分析',
    'code': '编程',
    'research': '研究',
    'design': '设计',
    'translate': '翻译'
  }

  // AI 标准化验收标准（根据任务类型生成）
  const getAcceptanceCriteria = (taskType, requirement) => {
    const criteria = {
      'analysis': [
        '数据来源可靠，至少引用 3 个权威来源',
        '分析结论有数据支撑',
        '输出格式清晰（Markdown/PDF）',
        '包含可视化图表（如适用）'
      ],
      'code': [
        '代码可正常运行，无语法错误',
        '包含必要的注释和文档',
        '通过基本测试用例',
        '代码风格符合最佳实践'
      ],
      'research': [
        '覆盖主题核心要点',
        '引用来源可验证',
        '结论客观中立',
        '输出结构清晰'
      ],
      'design': [
        '符合设计需求描述',
        '文件格式正确（PNG/SVG/Figma）',
        '分辨率满足使用场景',
        '风格一致性'
      ],
      'translate': [
        '翻译准确，无遗漏',
        '术语翻译一致',
        '语句通顺自然',
        '格式与原文保持一致'
      ]
    }
    return criteria[taskType] || criteria['research']
  }

  const acceptanceCriteria = getAcceptanceCriteria(task.task_type, task.requirement)

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{task.title} - 蜂群任务市场</title>
        <meta name="description" content={task.requirement} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {/* 返回按钮 */}
        <button 
          onClick={() => router.push('/')}
          style={{ 
            background: 'none', 
            border: '1px solid #444', 
            color: '#bb86fc', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1.5rem'
          }}
        >
          ← 返回列表
        </button>

        {/* 任务标题 */}
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#bb86fc' }}>{task.title}</h1>

        {/* 标签 */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <span style={{ 
            backgroundColor: difficultyColors[task.difficulty] || '#666', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {task.difficulty === 'EASY' ? '简单' : task.difficulty === 'MEDIUM' ? '中等' : '困难'}
          </span>
          <span style={{ 
            backgroundColor: '#2d2d2d', 
            border: '1px solid #444',
            padding: '0.25rem 0.75rem', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {typeLabels[task.task_type] || task.task_type}
          </span>
          <span style={{ 
            backgroundColor: '#1a1a2e', 
            border: '1px solid #03dac6',
            color: '#03dac6',
            padding: '0.25rem 0.75rem', 
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            {task.reward_amount} USDC
          </span>
        </div>

        {/* 任务描述 */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #333' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#03dac6', fontSize: '1.2rem' }}>任务描述</h2>
          <p style={{ margin: 0, lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{task.requirement}</p>
        </div>

        {/* 任务详情 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>预计工时</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{task.estimated_hours} 小时</div>
          </div>
          <div style={{ backgroundColor: '#1e1e1e', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>任务状态</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: task.status === 'active' ? '#4CAF50' : '#FF9800' }}>
              {task.status === 'active' ? '进行中' : '待处理'}
            </div>
          </div>
          <div style={{ backgroundColor: '#1e1e1e', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>发布时间</div>
            <div style={{ fontSize: '1rem' }}>{new Date(task.created_at).toLocaleDateString('zh-CN')}</div>
          </div>
        </div>

        {/* AI 验收标准 */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #333' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#bb86fc', fontSize: '1.2rem' }}>🤖 AI 验收标准</h2>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
            {acceptanceCriteria.map((criteria, index) => (
              <li key={index}>{criteria}</li>
            ))}
          </ul>
          <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.85rem', fontStyle: 'italic' }}>
            * 以上验收标准由 AI 自动生成，最终解释权归任务发布者所有
          </p>
        </div>

        {/* 认领按钮 */}
        <button
          onClick={handleClaim}
          style={{
            width: '100%',
            padding: '1.25rem',
            backgroundColor: '#03dac6',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#00c9b7'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#03dac6'}
        >
          认领任务
        </button>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem 0', backgroundColor: '#121212', color: '#bb86fc', marginTop: '2rem' }}>
        <p>蜂群任务市场 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}