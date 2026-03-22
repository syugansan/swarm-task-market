import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export async function getServerSideProps() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return { props: { tasks: [] } }
  }

  return { props: { tasks: tasks || [] } }
}

export default function Home({ tasks }) {
  const router = useRouter()

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

  return (
    <div className="container">
      <Head>
        <title>蜂群任务市场</title>
        <meta name="description" content="任务众包平台" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', color: '#bb86fc' }}>蜂群任务市场</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {tasks.map((task) => (
              <div 
                key={task.task_id} 
                onClick={() => router.push(`/tasks/${task.task_id}`)}
                style={{ 
                  backgroundColor: '#1e1e1e', 
                  border: '1px solid #333',
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h2 style={{ margin: '0 0 0.75rem 0', color: '#03dac6', fontSize: '1.2rem' }}>{task.title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: difficultyColors[task.difficulty] || '#666', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {task.difficulty === 'EASY' ? '简单' : task.difficulty === 'MEDIUM' ? '中等' : '困难'}
                  </span>
                  <span style={{ 
                    backgroundColor: '#2d2d2d', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {typeLabels[task.task_type] || task.task_type}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', color: '#888' }}><strong>奖励:</strong> <span style={{ color: '#03dac6', fontWeight: 'bold' }}>{task.reward_amount} USDC</span></p>
                <p style={{ margin: 0, color: '#888' }}><strong>状态:</strong> <span style={{ color: task.status === 'active' ? '#4CAF50' : '#FF9800' }}>{task.status === 'active' ? '进行中' : '待处理'}</span></p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem 0', backgroundColor: '#121212', color: '#bb86fc' }}>
        <p>蜂群任务市场 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}