-- SwarmWork 技能市场数据库表
-- 创建时间: 2026-03-23

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    icon TEXT DEFAULT '◈',
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'swarm', -- swarm, routing, coding, analysis, prompt
    
    -- 定价
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    
    -- 统计
    inherit_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- 发布者
    publisher_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    publisher_name TEXT,
    publisher_wallet TEXT, -- Solana 钱包地址
    
    -- 收益
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    
    -- 状态
    status TEXT DEFAULT 'draft', -- draft, pending, approved, rejected, deprecated
    featured BOOLEAN DEFAULT false,
    
    -- 内容
    content_url TEXT, -- 技能包下载地址
    documentation_url TEXT,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    
    -- 约束
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_category CHECK (category IN ('swarm', 'routing', 'coding', 'analysis', 'prompt', 'other'))
);

-- 技能继承记录表
CREATE TABLE IF NOT EXISTS skill_inherits (
    inherit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    
    -- 继承者
    inheritor_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    inheritor_wallet TEXT, -- 付款钱包
    
    -- 交易
    amount DECIMAL(10, 2) NOT NULL,
    tx_signature TEXT, -- Solana 交易签名
    
    -- 状态
    status TEXT DEFAULT 'completed', -- pending, completed, refunded
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 技能收益表
CREATE TABLE IF NOT EXISTS skill_earnings (
    earning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    publisher_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    
    -- 收益
    amount DECIMAL(10, 2) NOT NULL,
    source_type TEXT NOT NULL, -- inherit, tip, bonus
    source_id UUID, -- inherit_id or other reference
    
    -- 提现状态
    withdrawn BOOLEAN DEFAULT false,
    withdrawn_at TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 技能评价表
CREATE TABLE IF NOT EXISTS skill_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,
    
    -- 评价
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束：每个用户每个技能只能评价一次
    CONSTRAINT unique_review UNIQUE (skill_id, reviewer_id)
);

-- 索引
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_publisher ON skills(publisher_id);
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_featured ON skills(featured) WHERE featured = true;
CREATE INDEX idx_skills_free ON skills(is_free) WHERE is_free = true;

CREATE INDEX idx_inherits_skill ON skill_inherits(skill_id);
CREATE INDEX idx_inherits_inheritor ON skill_inherits(inheritor_id);
CREATE INDEX idx_inherits_created ON skill_inherits(created_at DESC);

CREATE INDEX idx_earnings_skill ON skill_earnings(skill_id);
CREATE INDEX idx_earnings_publisher ON skill_earnings(publisher_id);

CREATE INDEX idx_reviews_skill ON skill_reviews(skill_id);

-- 视图：技能统计
CREATE OR REPLACE VIEW skill_stats AS
SELECT 
    s.skill_id,
    s.title,
    s.category,
    s.price,
    s.is_free,
    s.inherit_count,
    s.total_earnings,
    s.publisher_name,
    COUNT(DISTINCT si.inheritor_id) as unique_inheritors,
    COALESCE(AVG(sr.rating), 0) as avg_rating,
    COUNT(sr.review_id) as review_count
FROM skills s
LEFT JOIN skill_inherits si ON s.skill_id = si.skill_id
LEFT JOIN skill_reviews sr ON s.skill_id = sr.skill_id
WHERE s.status = 'approved'
GROUP BY s.skill_id;

-- 触发器：更新 inherit_count
CREATE OR REPLACE FUNCTION update_skill_inherit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE skills
    SET inherit_count = inherit_count + 1,
        updated_at = NOW()
    WHERE skill_id = NEW.skill_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inherit_count
AFTER INSERT ON skill_inherits
FOR EACH ROW
EXECUTE FUNCTION update_skill_inherit_count();

-- 触发器：更新 total_earnings
CREATE OR REPLACE FUNCTION update_skill_earnings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE skills
    SET total_earnings = total_earnings + NEW.amount,
        updated_at = NOW()
    WHERE skill_id = NEW.skill_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_earnings
AFTER INSERT ON skill_earnings
FOR EACH ROW
EXECUTE FUNCTION update_skill_earnings();

-- RLS 策略
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_inherits ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_reviews ENABLE ROW LEVEL SECURITY;

-- 公开读取已批准的技能
CREATE POLICY "Approved skills are viewable by everyone" ON skills
    FOR SELECT USING (status = 'approved');

-- 发布者可以更新自己的技能
CREATE POLICY "Publishers can update own skills" ON skills
    FOR UPDATE USING (publisher_id = auth.uid());

-- 发布者可以创建技能
CREATE POLICY "Anyone can create skills" ON skills
    FOR INSERT WITH CHECK (true);

-- 继承记录公开可读
CREATE POLICY "Inherits are viewable by everyone" ON skill_inherits
    FOR SELECT USING (true);

-- 评价公开可读
CREATE POLICY "Reviews are viewable by everyone" ON skill_reviews
    FOR SELECT USING (true);

-- 用户可以创建评价
CREATE POLICY "Users can create reviews" ON skill_reviews
    FOR INSERT WITH CHECK (true);

-- 初始化示例数据
INSERT INTO skills (title, icon, description, tags, category, price, is_free, inherit_count, publisher_name, total_earnings, status, featured) VALUES
('统计路由系统 v2.0', '⟳', '基于历史均值+方差的智能路由算法，自动将任务分配给最稳定的模型。包含完整的Python实现和配置文档。DeepSeek V3.2验证有效。', ARRAY['蜂群', '路由', 'Python'], 'swarm', 2.5, false, 342, 'Moly · swrm.work', 855, 'approved', true),
('任务粒度分解器', '⊞', '将大任务拆解为1-5分钟最优粒度子任务，支持依赖调度和并行波次执行。实测1.53x加速比，适配所有主流蜂群框架。', ARRAY['蜂群', '分析', '调度'], 'swarm', 1.5, false, 218, '0x4a2f...8e3d', 327, 'approved', false),
('CCI指标分析提示词', '◈', '专为金融技术分析优化的提示词模板，包含超买超卖识别、背离信号检测、置信度评估。DeepSeek V3.2均值0.92验证。', ARRAY['提示词', '分析', '金融'], 'prompt', 0, true, 1203, '0x9b2c...1f7e', 0, 'approved', false),
('Claude Code自动化工作流', '⌘', '通过OpenClaw触发Claude Code执行复杂编程任务，支持测试循环、错误自修复、PR自动提交。配合蜂群使用效果最佳。', ARRAY['编程', '蜂群', '自动化'], 'coding', 1.0, false, 567, 'nateliason · X', 567, 'approved', false),
('多模型结果融合算法', '◎', '将多个模型对同一任务的输出进行智能融合，基于置信度加权，自动识别最优结果。支持投票、均值、最大置信三种策略。', ARRAY['蜂群', '路由'], 'swarm', 3.0, false, 89, '0x3d8f...2a1b', 267, 'approved', false),
('Solana钱包集成模板', '▣', 'OpenClaw agent接入Solana钱包的完整实现，支持USDC收发、余额查询、交易签名。适合需要链上操作的蜂群应用。', ARRAY['编程', 'Web3', 'Solana'], 'coding', 0, true, 445, '0x6e4d...9c3a', 0, 'approved', false);

-- 授权
GRANT SELECT ON skills TO anon, authenticated;
GRANT INSERT ON skills TO authenticated;
GRANT UPDATE ON skills TO authenticated;
GRANT SELECT ON skill_inherits TO anon, authenticated;
GRANT INSERT ON skill_inherits TO authenticated;
GRANT SELECT ON skill_earnings TO authenticated;
GRANT INSERT ON skill_earnings TO authenticated;
GRANT SELECT ON skill_reviews TO anon, authenticated;
GRANT INSERT ON skill_reviews TO authenticated;
GRANT SELECT ON skill_stats TO anon, authenticated;