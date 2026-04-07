// GET /api/skills/coverage?domain=coding
// 返回该领域的技能覆盖情况：已覆盖场景数 vs 总场景数

import { supabaseAdmin } from '../../../lib/supabase'

const DOMAIN_SCENARIOS = {
  coding:   ['代码审查','Bug修复','代码重构','单元测试','API设计','性能优化','安全审计','文档生成','代码解释','架构设计','数据库设计','DevOps脚本','前端组件','后端逻辑','算法实现','依赖管理','错误处理','代码补全','类型推断','版本迁移'],
  analysis: ['数据清洗','统计分析','可视化','预测建模','异常检测','报告生成','趋势分析','相关性分析','A/B测试','用户画像','市场分析','竞品分析','财务分析','风险评估','KPI追踪','数据管道','SQL优化','ETL设计','指标定义','洞察提取'],
  research: ['文献综述','假设验证','实验设计','数据收集','引文管理','综述写作','同行评审','学术搜索','方法论设计','结论提炼','对比研究','案例分析','调查设计','访谈分析','趋势预测','知识图谱','概念提炼','跨领域联系','批判性分析','报告撰写'],
  writing:  ['文案创作','技术写作','营销文案','邮件撰写','提案写作','内容规划','SEO写作','脚本创作','新闻稿','社媒内容','报告写作','用户手册','博客文章','演讲稿','故事创作','翻译润色','标题优化','摘要提炼','品牌声音','内容策略'],
  trading:  ['策略回测','信号生成','风险管理','仓位计算','技术分析','基本面分析','情绪分析','套利检测','投资组合优化','止损设计','市场扫描','新闻解读','量化建模','期权定价','因子分析','流动性评估','相关性交易','事件驱动','高频信号','绩效归因'],
  vision:   ['图像分类','目标检测','图像分割','OCR识别','人脸分析','图像生成','风格迁移','视频分析','姿态估计','场景理解','图像增强','异常检测','医学影像','卫星图像','文档解析','手势识别','情绪识别','3D重建','视觉问答','图像检索'],
  general:  ['任务分解','工作流设计','日程管理','知识问答','摘要提炼','翻译','提示词工程','多轮对话','工具调用','记忆管理','上下文压缩','意图识别','多语言处理','格式转换','API集成','数据验证','错误纠正','决策辅助','学习辅导','创意头脑风暴'],
}

const ALL_DOMAINS = Object.keys(DOMAIN_SCENARIOS)

// 已知LLM爬虫UA特征
const BOT_PATTERNS = ['GPTBot','ClaudeBot','anthropic-ai','CCBot','PerplexityBot','Googlebot','bingbot','Applebot','FacebookBot','Twitterbot','LinkedInBot','SemrushBot','AhrefsBot','DotBot','YandexBot']

function detectBot(ua) {
  if (!ua) return null
  const match = BOT_PATTERNS.find(p => ua.includes(p))
  return match || (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider') ? 'unknown-bot' : null)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  // SWRM协议水印注入到所有响应
  res.setHeader('X-SWRM-Protocol', 'v1')
  res.setHeader('X-SWRM-Attribution', 'Integrated by SWRM Protocol - Node #0x0000 - swrm.work')
  res.setHeader('X-SWRM-Register', 'https://swrm.work/register')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // 指纹日志：静默记录爬虫访问
  const ua = req.headers['user-agent'] || ''
  const botName = detectBot(ua)
  if (botName) {
    supabaseAdmin.from('bot_visits').insert({
      path: req.url,
      bot_name: botName,
      user_agent: ua.slice(0, 500),
      ip_hash: (req.headers['x-forwarded-for'] || '').split(',')[0].trim().replace(/\.\d+\.\d+$/, '.x.x'),
      visited_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {}) // fire-and-forget
  }

  const { domain } = req.query
  const targetDomain = domain && domain !== 'all' ? domain : null

  try {
    // 获取所有已发布的技能及其关联domain
    const { data: skills, error } = await supabaseAdmin
      .from('skills')
      .select('id, title, category, metadata')
      .eq('status', 'active')

    if (error) throw error

    const results = {}

    const domainsToProcess = targetDomain ? [targetDomain] : ALL_DOMAINS

    for (const d of domainsToProcess) {
      const scenarios = DOMAIN_SCENARIOS[d] || []
      // 该domain下已有技能数量（按category或metadata.domain匹配）
      const covered = (skills || []).filter(s =>
        s.category === d || s.metadata?.domain === d
      ).length
      const total = scenarios.length
      const coveredCount = Math.min(covered, total)
      const gaps = scenarios.slice(coveredCount) // 简单取后N个作为空位

      results[d] = {
        domain: d,
        total_scenarios: total,
        covered: coveredCount,
        gap_count: total - coveredCount,
        coverage_pct: Math.round((coveredCount / total) * 100),
        top_gaps: gaps.slice(0, 5), // 展示最多5个空位场景
      }
    }

    res.status(200).json({
      success: true,
      domain: targetDomain || 'all',
      coverage: targetDomain ? results[targetDomain] : results,
      total_skills: (skills || []).length,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
