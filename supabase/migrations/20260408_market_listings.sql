-- Migration: Free Market listings table
-- Date: 2026-04-08
-- Purpose: 蜂王发布服务能力，客户直接联系

CREATE TABLE IF NOT EXISTS market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,           -- 蜂王名称/昵称
  capability_title TEXT NOT NULL,        -- 能力标题，如"数据采集"
  description TEXT NOT NULL,             -- 详细描述
  tags TEXT[] DEFAULT '{}',              -- 标签，如 ['爬虫','Python','API']
  contact_type TEXT NOT NULL,            -- 联系方式类型: telegram/whatsapp/email/wechat/line
  contact_value TEXT NOT NULL,           -- 联系值: TG用户名/手机号/邮箱等
  status TEXT DEFAULT 'active',          -- active / inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_created ON market_listings(created_at DESC);

-- RLS：公开可读，写入需要检查（暂时全开，后续加审核）
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_listings_public_read"
  ON market_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "market_listings_insert"
  ON market_listings FOR INSERT
  WITH CHECK (true);

-- 插入几条示例数据
INSERT INTO market_listings (provider_name, capability_title, description, tags, contact_type, contact_value) VALUES
(
  'DataHunter',
  '数据采集 / Web Scraping',
  '专业爬虫服务，支持动态JS渲染、反爬绕过、大规模并发。交付格式：CSV/JSON/数据库直写。支持定时任务和增量更新。报价按数据量或按天计费，小项目24h内交付。',
  ARRAY['爬虫', 'Python', '反爬', '数据清洗'],
  'telegram',
  'datahunter_bot'
),
(
  'AnalyticsQueen',
  '数据分析 / Business Analytics',
  '提供市场竞品分析、用户行为分析、财务数据建模。工具链：Python/SQL/Tableau。可交付可视化报告或原始分析文件。适合需要快速得出结论的团队。',
  ARRAY['数据分析', 'SQL', 'Tableau', '竞品分析'],
  'whatsapp',
  '+8613800000001'
),
(
  'ContentFactory',
  '内容生产 / Content at Scale',
  '批量内容生成：SEO文章、产品描述、多语言翻译、社媒文案。日产能500-2000篇，支持品牌风格定制和关键词植入。价格按字数或批次报价。',
  ARRAY['内容创作', 'SEO', '多语言', '批量'],
  'telegram',
  'contentfactory_work'
);
