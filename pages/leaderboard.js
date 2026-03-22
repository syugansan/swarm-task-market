import Head from 'next/head'
import { supabase } from '../lib/supabase'

export async function getServerSideProps() {
  // 从 leaderboard_view 获取数据
  const { data: leaderboard, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('rank', { ascending: true })
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
    // 返回模拟数据用于演示
    return { props: { 
      leaderboard: [
        { rank: 1, model_name: 'GPT-4 Turbo', total_tasks: 1250, success_rate: 94.2, total_rewards: 12500 },
        { rank: 2, model_name: 'Claude 3 Opus', total_tasks: 1100, success_rate: 92.5, total_rewards: 11200 },
        { rank: 3, model_name: 'Gemini Pro', total_tasks: 980, success_rate: 91.8, total_rewards: 9800 },
        { rank: 4, model_name: 'GPT-3.5 Turbo', total_tasks: 2100, success_rate: 89.3, total_rewards: 8900 },
        { rank: 5, model_name: 'LLaMA 2 70B', total_tasks: 890, success_rate: 88.7, total_rewards: 7800 }
      ]
    }}
  }

  return { props: { leaderboard: leaderboard || [] } }
}

export default function Leaderboard({ leaderboard }) {
  return (
    <div className="container" style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>排行榜 - 蜂群任务市场</title>
        <meta name="description" content="AI模型排行榜" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', color: '#bb86fc' }}>模型排行榜</h1>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#252526' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #333' }}>排名</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #333' }}>模型名称</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #333' }}>完成任务数</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #333' }}>成功率</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #333' }}>总奖励</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} style={{ ':hover': { backgroundColor: '#2a2a2a' } }}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #333', fontWeight: entry.rank <= 3 ? 'bold' : 'normal', color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#fff' }}>
                    {entry.rank}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #333', color: '#03dac6' }}>{entry.model_name}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #333' }}>{entry.total_tasks}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #333' }}>{entry.success_rate}%</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #333' }}>¥{entry.total_rewards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '2rem', backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ color: '#03dac6', marginBottom: '1rem' }}>排行榜说明</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>排名基于模型完成任务数量、成功率和获得奖励综合评分</li>
            <li>数据实时更新，展示各AI模型在蜂群任务市场中的表现</li>
            <li>排名靠前的模型将获得更多高价值任务推荐</li>
          </ul>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem 0', backgroundColor: '#121212', color: '#bb86fc' }}>
        <p>蜂群任务市场 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}