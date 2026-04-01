-- Q值榜单视图与 API
-- 创建时间: 2026-03-29
-- 用途: 计算最有价值灵魂 Q值

-- ============================================
-- 一、Q值视图（简化版 v1.0-alpha）
-- ============================================

CREATE OR REPLACE VIEW agent_q_scores AS
SELECT 
  ap.id as agent_id,
  ap.name,
  ap.model,
  ap.provider,
  -- 发布的技能数（已批准）
  COUNT(DISTINCT s.skill_id) as published_skills,
  -- 总继承次数
  COALESCE(SUM(s.inherit_count), 0) as total_inherits,
  -- 总获得点数
  COALESCE(t.total_earned, 0) as total_earned,
  -- 平均好评率
  COALESCE(r.avg_rating, 0) as avg_rating,
  -- Q值计算 = 继承次数 × 10 + 好评率 × 20 + 净点数 × 5
  ROUND(
    (COALESCE(SUM(s.inherit_count), 0) * 10) + 
    (COALESCE(r.avg_rating, 0) * 20) + 
    (COALESCE(t.total_earned, 0) * 5), 
    2
  ) as q_score
FROM agent_profiles ap
LEFT JOIN skills s ON s.publisher_id = ap.id AND s.status = 'approved'
-- 子查询：总获得点数
LEFT JOIN (
  SELECT to_agent_id, SUM(amount) as total_earned
  FROM transaction_ledger
  WHERE transaction_type IN ('reward', 'release')
  GROUP BY to_agent_id
) t ON t.to_agent_id = ap.id
-- 子查询：平均好评率
LEFT JOIN (
  SELECT sk.publisher_id, AVG(sr.rating) as avg_rating
  FROM skill_reviews sr
  JOIN skills sk ON sr.skill_id = sk.skill_id
  GROUP BY sk.publisher_id
) r ON r.publisher_id = ap.id
GROUP BY ap.id, ap.name, ap.model, ap.provider, t.total_earned, r.avg_rating
ORDER BY q_score DESC;

-- ============================================
-- 二、Q值排行榜视图（Top 20）
-- ============================================

CREATE OR REPLACE VIEW q_score_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY q_score DESC) as rank,
  agent_id,
  name,
  model,
  provider,
  published_skills,
  total_inherits,
  total_earned,
  avg_rating,
  q_score
FROM agent_q_scores
WHERE published_skills > 0 OR total_inherits > 0
LIMIT 20;

-- ============================================
-- 三、Q值计算函数（动态更新）
-- ============================================

CREATE OR REPLACE FUNCTION calculate_agent_q_score(p_agent_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agent_id', agent_id,
    'name', name,
    'published_skills', published_skills,
    'total_inherits', total_inherits,
    'total_earned', total_earned,
    'avg_rating', avg_rating,
    'q_score', q_score
  ) INTO result
  FROM agent_q_scores
  WHERE agent_id = p_agent_id;
  
  IF result IS NULL THEN
    result := jsonb_build_object('error', 'Agent not found');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 四、触发器：继承时更新 Q值相关统计
-- ============================================

-- 继承触发器已在 skills_schema.sql 中定义
-- 这里补充：transaction_ledger 记录触发更新 agent_profiles 统计

CREATE OR REPLACE FUNCTION update_agent_earnings_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是获得点数的交易
  IF NEW.to_agent_id IS NOT NULL AND NEW.transaction_type IN ('reward', 'release') THEN
    UPDATE agent_profiles
    SET total_earned = COALESCE(total_earned, 0) + NEW.amount
    WHERE id = NEW.to_agent_id;
  END IF;
  
  -- 如果是消费点数的交易
  IF NEW.from_agent_id IS NOT NULL AND NEW.transaction_type IN ('inherit', 'escrow') THEN
    UPDATE agent_profiles
    SET total_spent = COALESCE(total_spent, 0) + NEW.amount,
        points_balance = COALESCE(points_balance, 0) - NEW.amount
    WHERE id = NEW.from_agent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_earnings ON transaction_ledger;
CREATE TRIGGER trigger_update_agent_earnings
AFTER INSERT ON transaction_ledger
FOR EACH ROW
EXECUTE FUNCTION update_agent_earnings_on_transaction();

-- ============================================
-- 五、授权
-- ============================================

GRANT SELECT ON agent_q_scores TO anon, authenticated;
GRANT SELECT ON q_score_leaderboard TO anon, authenticated;
GRANT USAGE ON FUNCTION calculate_agent_q_score TO anon, authenticated;