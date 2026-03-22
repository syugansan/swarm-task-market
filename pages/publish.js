import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

// 测试用户 UUID（等 Solana 钱包集成后替换）
const TEST_CREATOR_ID = '09e1e688-a70f-4b98-aa6c-d33fc2cbc7f8'

export default function Publish() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    task_type: '',
    requirement: '',
    difficulty: 'MEDIUM',
    estimated_hours: 1,
    reward_amount: 10
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        creator_id: TEST_CREATOR_ID,
        title: form.title,
        task_type: form.task_type,
        requirement: form.requirement,
        difficulty: form.difficulty,
        estimated_hours: parseFloat(form.estimated_hours),
        reward_amount: parseFloat(form.reward_amount),
        status: 'active'
      }])
      .select()

    setLoading(false)

    if (error) {
      alert('发布失败: ' + error.message)
      console.error(error)
    } else {
      alert('发布成功！')
      router.push('/')
    }
  }

  return (
    <div className="container" style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>发布任务 - 蜂群任务市场</title>
        <meta name="description" content="发布新任务" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', color: '#bb86fc' }}>发布新任务</h1>
        
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', border: '1px solid #333' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>任务标题</label>
            <input 
              type="text" 
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="输入任务标题" 
              required
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>任务类型</label>
            <select 
              name="task_type"
              value={form.task_type}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            >
              <option value="">选择任务类型</option>
              <option value="analysis">分析</option>
              <option value="code">编程</option>
              <option value="research">研究</option>
              <option value="design">设计</option>
              <option value="translate">翻译</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>任务要求</label>
            <textarea 
              name="requirement"
              value={form.requirement}
              onChange={handleChange}
              placeholder="详细描述任务要求" 
              rows="4"
              required
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>难度等级</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="difficulty" value="EASY" checked={form.difficulty === 'EASY'} onChange={handleChange} style={{ marginRight: '0.5rem' }} /> 简单
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="difficulty" value="MEDIUM" checked={form.difficulty === 'MEDIUM'} onChange={handleChange} style={{ marginRight: '0.5rem' }} /> 中等
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="difficulty" value="HARD" checked={form.difficulty === 'HARD'} onChange={handleChange} style={{ marginRight: '0.5rem' }} /> 困难
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>预计工时（小时）</label>
            <input 
              type="number" 
              name="estimated_hours"
              value={form.estimated_hours}
              onChange={handleChange}
              min="0.5"
              step="0.5"
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#03dac6' }}>奖励金额（USDC）</label>
            <input 
              type="number" 
              name="reward_amount"
              value={form.reward_amount}
              onChange={handleChange}
              step="0.01"
              min="1"
              placeholder="USDC"
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: loading ? '#666' : '#03dac6', 
              color: '#000', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '1.1rem', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? '发布中...' : '发布任务'}
          </button>
        </form>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem 0', backgroundColor: '#121212', color: '#bb86fc' }}>
        <p>蜂群任务市场 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}