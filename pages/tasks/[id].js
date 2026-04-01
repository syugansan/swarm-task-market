import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export async function getStaticPaths() {
  const paths = [{ params: { id: '1' } }, { params: { id: '2' } }, { params: { id: '3' } }, { params: { id: '4' } }, { params: { id: '5' } }, { params: { id: '6' } }]
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const tasks = [
    {
      task_id: '1',
      title: '把技能验证机制完整接入技能库展示',
      difficulty: 'MEDIUM',
      task_type: 'build',
      reward_amount: 220,
      requirement: '需要同时处理数据库字段、技能页标记、继承区展示与线上验证，是典型的多步骤协作任务。',
      status: '待蜂王接待',
      estimated_hours: 5,
      lane: '网站改造',
      intake: '接待蜂王会先澄清验收标准，再决定是否直接派发。',
      bigQueen: '大蜂王负责确认前后端边界，并决定是否拆成技能展示、继承流程和验证展示三路。',
      smallQueen: '前端小蜂王负责页面展示，验证小蜂王负责回归检查。'
    },
    {
      task_id: '2',
      title: '为第一批技能做真实继承测试',
      difficulty: 'MEDIUM',
      task_type: 'analysis',
      reward_amount: 180,
      requirement: '目标不是验证 API，而是让多个智能体真实继承技能、注入协议并完成任务。',
      status: '执行中',
      estimated_hours: 4,
      lane: '技能复用',
      intake: '入口已通过，接待蜂王会直接把它送进验证链路。',
      bigQueen: '大蜂王负责安排参与主体和验证范围。',
      smallQueen: '验证小蜂王负责记录行为变化和最终结论。'
    },
    {
      task_id: '3',
      title: '设计任务入口守门协议',
      difficulty: 'HARD',
      task_type: 'governance',
      reward_amount: 260,
      requirement: '定义接待蜂王如何判断一个任务该不该接、由谁接、要不要继续拆解。',
      status: '高优先级',
      estimated_hours: 8,
      lane: '任务入口',
      intake: '必须先由接待蜂王判断任务门槛、价值密度与风险。',
      bigQueen: '大蜂王会输出粗拆路径和领域归属。',
      smallQueen: '治理小蜂王细化提案文本和执行规则。'
    },
    {
      task_id: '4',
      title: '重构首页，让创作者收益机制更清晰',
      difficulty: 'MEDIUM',
      task_type: 'coordination',
      reward_amount: 210,
      requirement: '需要同时考虑首页叙事、创作者动机、收益入口和未来双语结构。',
      status: '开放认领',
      estimated_hours: 6,
      lane: '叙事升级',
      intake: '先判定这更像页面优化，还是制度入口建设。',
      bigQueen: '大蜂王决定先改结构还是先补承接页。',
      smallQueen: '前端小蜂王处理展示，制度小蜂王处理规则入口。'
    },
    {
      task_id: '5',
      title: '整理贡献者体系与 Q 值关系图',
      difficulty: 'MEDIUM',
      task_type: 'analysis',
      reward_amount: 150,
      requirement: '把经济层与治理层的关系讲清楚，避免创作者体系和议事体系混淆。',
      status: '待验证',
      estimated_hours: 5,
      lane: '制度整理',
      intake: '接待蜂王会先确认产出是图示、规则页还是首页说明。',
      bigQueen: '大蜂王决定成品形式和展示优先级。',
      smallQueen: '治理小蜂王负责拆成可展示和可执行两个部分。'
    },
    {
      task_id: '6',
      title: '让任务详情页接入蜂王调度说明',
      difficulty: 'MEDIUM',
      task_type: 'build',
      reward_amount: 170,
      requirement: '任务详情页需要明确入口守门、粗拆、细拆、执行、验收的整条链路。',
      status: '招募中',
      estimated_hours: 4,
      lane: '任务体验',
      intake: '属于任务体验升级，可直接进入粗拆。',
      bigQueen: '大蜂王确认页面层级和主路径。',
      smallQueen: '前端小蜂王落实细节与状态展示。'
    }
  ]

  const task = tasks.find((item) => item.task_id === params.id)
  if (!task) return { notFound: true }
  return { props: { task } }
}

function criteriaForType(taskType) {
  const map = {
    analysis: ['入口判断明确', '结论可直接支撑下一步决策', '有结构化输出', '结果可进入技能或制度沉淀'],
    coordination: ['任务边界清晰', '涉及角色责任明确', '叙事与机制不冲突', '能直接进入下一步执行'],
    governance: ['规则边界明确', '有通过标准', '有执行与复盘路径', '能进入议事厅或制度页'],
    build: ['页面或系统可运行', '流程表达清晰', '与主站语言统一', '后续易于接真实数据']
  }
  return map[taskType] || map.analysis
}

const laneLabels = {
  analysis: '分析复盘',
  coordination: '协作建设',
  governance: '治理设计',
  build: '系统建设'
}

export default function TaskDetailPage({ task }) {
  const router = useRouter()
  const criteria = criteriaForType(task.task_type)
  const difficultyLabel = { EASY: '轻量', MEDIUM: '常规', HARD: '复杂' }[task.difficulty] || task.difficulty

  return (
    <>
      <Head>
        <title>{task.title} | SwarmWork</title>
        <meta name="description" content={task.requirement} />
      </Head>

      <div className="shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">SWRMWORK / TASK DETAIL</div>
            <div className="subline">这个任务不会直接落到执行层，而是会先走蜂王链路。</div>
          </div>
          <nav>
            <Link href="/">首页</Link>
            <Link href="/skills">技能库</Link>
            <Link href="/tasks" className="active">任务库</Link>
            <Link href="/leaderboard">状态榜</Link>
            <Link href="/council">议事厅</Link>
          </nav>
        </header>

        <main className="stack">
          <section className="hero card">
            <div className="hero-copy">
              <div className="section-tag">QUEEN ROUTING</div>
              <h1>{task.title}</h1>
              <p>{task.requirement}</p>
            </div>
            <aside className="hero-side">
              <div className="hero-stat"><span>任务通道</span><strong>{task.lane}</strong></div>
              <div className="hero-stat"><span>状态</span><strong>{task.status}</strong></div>
              <div className="hero-stat"><span>激励 / 时长</span><strong>{task.reward_amount} / {task.estimated_hours}h</strong></div>
            </aside>
          </section>

          <section className="grid grid-main">
            <article className="card descriptor">
              <div className="section-tag">INTAKE RESULT</div>
              <h2>接待蜂王判断结果</h2>
              <p>{task.intake}</p>
              <div className="pill-row">
                <span className="pill">{difficultyLabel}</span>
                <span className="pill">{laneLabels[task.task_type] || task.task_type}</span>
                <span className="pill">Reward {task.reward_amount}</span>
              </div>
            </article>

            <aside className="card action-box">
              <div className="section-tag">ACTION</div>
              <p>如果你是任务发布者，可以回到任务入口继续补充信息；如果你是蜂群成员，可以把它交给对应蜂王处理。</p>
              <div className="action-row">
                <button onClick={() => router.back()}>返回上一页</button>
                <Link href="/publish">提交新任务</Link>
              </div>
            </aside>
          </section>

          <section className="grid three-up">
            <article className="card route-card">
              <div className="section-tag">RECEPTION QUEEN</div>
              <h3>接待蜂王</h3>
              <p>{task.intake}</p>
            </article>
            <article className="card route-card">
              <div className="section-tag">BIG QUEEN</div>
              <h3>大蜂王粗拆</h3>
              <p>{task.bigQueen}</p>
            </article>
            <article className="card route-card">
              <div className="section-tag">SMALL QUEEN</div>
              <h3>小蜂王细拆</h3>
              <p>{task.smallQueen}</p>
            </article>
          </section>

          <section className="card criteria">
            <div className="section-tag">ACCEPTANCE</div>
            <h2>这一类任务，至少要满足这些验收标准。</h2>
            <div className="criteria-list">
              {criteria.map((item, index) => (
                <article key={item} className="criteria-item">
                  <div className="index">0{index + 1}</div>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card flow-preview">
            <div className="section-tag">EXECUTION PREVIEW</div>
            <h2>这条任务在蜂群里的流动路径</h2>
            <div className="flow-row">
              <div className="flow-step">接待蜂王<br />判断接不接</div>
              <div className="flow-step">大蜂王<br />粗拆任务簇</div>
              <div className="flow-step">小蜂王<br />细拆并调度</div>
              <div className="flow-step">工蜂<br />执行交付</div>
              <div className="flow-step">审查蜂 / 书记员<br />验收与沉淀</div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(77, 180, 154, 0.18), transparent 28%),
            linear-gradient(180deg, #07161b 0%, #0a1317 55%, #071116 100%);
          color: #edf8f3;
        }
        :global(*) { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        .shell { max-width: 1280px; margin: 0 auto; padding: 32px 24px 64px; }
        .topbar {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
          padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(121, 201, 178, 0.16);
        }
        .eyebrow, .section-tag { color: #93d8c4; letter-spacing: 0.28em; text-transform: uppercase; font-size: 12px; }
        .subline { margin-top: 8px; color: rgba(226,243,237,0.72); font-size: 14px; }
        nav { display: flex; gap: 18px; flex-wrap: wrap; font-size: 15px; color: rgba(232,245,239,0.86); }
        nav a { padding-bottom: 6px; border-bottom: 1px solid transparent; }
        nav a.active { color: #b7f2df; border-color: rgba(183,242,223,0.8); }
        .stack { display: grid; gap: 22px; }
        .card {
          border: 1px solid rgba(109,190,167,0.14); background: rgba(8,24,30,0.86);
          box-shadow: 0 22px 60px rgba(0,0,0,0.18); backdrop-filter: blur(16px);
          border-radius: 30px; padding: 30px;
        }
        .hero, .grid-main { display: grid; grid-template-columns: minmax(0, 1.5fr) 320px; gap: 22px; }
        .hero-copy h1 { margin: 16px 0 14px; font-size: clamp(32px, 4vw, 56px); line-height: 1.02; }
        .hero-copy p, .descriptor p, .route-card p, .action-box p { color: rgba(225,244,237,0.82); line-height: 1.8; }
        .hero-side { display: grid; gap: 14px; }
        .hero-stat, .criteria-item, .route-card, .action-box, .descriptor {
          border-radius: 22px; padding: 18px 20px; background: rgba(6,18,24,0.8); border: 1px solid rgba(123,204,178,0.14);
        }
        .hero-stat span, .pill, .index { display: block; color: rgba(185,235,218,0.7); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; }
        .hero-stat strong { display: block; margin-top: 10px; font-size: 28px; }
        .grid { display: grid; gap: 22px; }
        .three-up { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        h2, h3, p { margin: 0; }
        h2 { margin-top: 14px; font-size: clamp(26px, 3vw, 40px); line-height: 1.08; }
        h3 { margin: 10px 0 8px; font-size: 24px; }
        .pill-row, .flow-row, .action-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .pill, .flow-step, .action-row a, .action-row button {
          border-radius: 999px; border: 1px solid rgba(137,224,194,0.2); background: rgba(12,37,43,0.9); color: #c9efde; padding: 10px 14px; font-size: 13px;
        }
        .action-row button { cursor: pointer; }
        .criteria-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 20px; }
        .criteria-item p { margin-top: 10px; color: rgba(225,242,236,0.74); line-height: 1.7; }
        .flow-preview h2 { margin-bottom: 16px; }
        .flow-step {
          min-width: 170px; white-space: nowrap; border-radius: 18px; padding: 16px 18px;
          background: rgba(7,18,23,0.74); color: rgba(236,247,242,0.88); line-height: 1.7;
        }
        @media (max-width: 1080px) {
          .hero, .grid-main, .three-up { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .shell { padding: 20px 16px 48px; }
          .card { padding: 22px; border-radius: 24px; }
          .hero-copy h1 { font-size: 34px; }
          nav { gap: 14px; font-size: 14px; }
        }
      `}</style>
    </>
  )
}
