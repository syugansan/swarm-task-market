-- 质押发布机制配置与完善
-- 创建时间: 2026-03-29
-- 用途: 可配置的质押退还规则

-- ============================================
-- 一、system_config 表（可配置阈值）
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT DEFAULT 'string', -- string, number, boolean
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始配置
INSERT INTO system_config (key, value, value_type, description) VALUES
('escrow_amount', '1', 'number', '质押点数'),
('escrow_days', '30', 'number', '质押周期（天）'),
('min_inherits_for_release', '1', 'number', '最少继承次数'),
('min_rating_for_release', '3.5', 'number', '最低好评率（平均值）'),
('release_on_first_inherit', 'true', 'boolean', '是否首传即退'),
('rating_check_enabled', 'true', 'boolean', '是否启用好评率检查')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- ============================================
-- 二、skill_escrow 表完善字段
-- ============================================

-- 如果表不存在，先创建
CREATE TABLE IF NOT EXISTS skill_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  escrow_points DECIMAL(10,2) NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'held', -- held, released, expired, forfeited
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  release_reason TEXT, -- first_inherit, quality_passed, expired, low_rating
  inherits_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0
);

-- 添加缺失字段（如果表已存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skill_escrow' AND column_name = 'created_at') THEN
    ALTER TABLE skill_escrow ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skill_escrow' AND column_name = 'expires_at') THEN
    ALTER TABLE skill_escrow ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skill_escrow' AND column_name = 'release_reason') THEN
    ALTER TABLE skill_escrow ADD COLUMN release_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skill_escrow' AND column_name = 'inherits_count') THEN
    ALTER TABLE skill_escrow ADD COLUMN inherits_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skill_escrow' AND column_name = 'avg_rating') THEN
    ALTER TABLE skill_escrow ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escrow_skill ON skill_escrow(skill_id);
CREATE INDEX IF NOT EXISTS idx_escrow_owner ON skill_escrow(owner_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON skill_escrow(status);
CREATE INDEX IF NOT EXISTS idx_escrow_expires ON skill_escrow(expires_at);

-- ============================================
-- 三、触发器：继承时更新质押状态
-- ============================================

CREATE OR REPLACE FUNCTION update_escrow_on_inherit()
RETURNS TRIGGER AS $$
DECLARE
  release_on_first BOOLEAN;
  min_inherits INTEGER;
  min_rating DECIMAL(3,2);
  current_inherits INTEGER;
  current_rating DECIMAL(3,2);
BEGIN
  -- 从配置读取参数
  SELECT value INTO release_on_first FROM system_config WHERE key = 'release_on_first_inherit';
  SELECT value INTO min_inherits FROM system_config WHERE key = 'min_inherits_for_release';
  SELECT value INTO min_rating FROM system_config WHERE key = 'min_rating_for_release';
  
  release_on_first := COALESCE(release_on_first::boolean, true);
  min_inherits := COALESCE(min_inherits::integer, 1);
  min_rating := COALESCE(min_rating::decimal, 3.5);
  
  -- 更新质押表的继承计数
  UPDATE skill_escrow
  SET inherits_count = inherits_count + 1
  WHERE skill_id = NEW.skill_id AND status = 'held';
  
  -- 获取当前继承数和好评率
  SELECT inherits_count, avg_rating INTO current_inherits, current_rating
  FROM skill_escrow WHERE skill_id = NEW.skill_id AND status = 'held';
  
  -- 如果配置了首传即退，检查是否首次继承
  IF release_on_first AND current_inherits = 1 THEN
    UPDATE skill_escrow
    SET status = 'released',
        release_reason = 'first_inherit',
        released_at = NOW()
    WHERE skill_id = NEW.skill_id AND status = 'held';
    
    -- 退还质押点数
    INSERT INTO transaction_ledger (
      from_agent_id, to_agent_id, amount, transaction_type, reference_id, description
    )
    SELECT 
      NULL, 
      se.owner_id, 
      se.escrow_points, 
      'release', 
      NEW.skill_id, 
      'First inheritance escrow release'
    FROM skill_escrow se
    WHERE se.skill_id = NEW.skill_id AND se.release_reason = 'first_inherit';
    
  -- 如果达到质量门槛，也可退还（非首传即退时）
  ELSE IF NOT release_on_first AND current_inherits >= min_inherits AND current_rating >= min_rating THEN
    UPDATE skill_escrow
    SET status = 'released',
        release_reason = 'quality_passed',
        released_at = NOW()
    WHERE skill_id = NEW.skill_id AND status = 'held';
    
    INSERT INTO transaction_ledger (
      from_agent_id, to_agent_id, amount, transaction_type, reference_id, description
    )
    SELECT 
      NULL, 
      se.owner_id, 
      se.escrow_points, 
      'release', 
      NEW.skill_id, 
      'Quality threshold passed escrow release'
    FROM skill_escrow se
    WHERE se.skill_id = NEW.skill_id AND se.release_reason = 'quality_passed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_escrow_inherit ON skill_inheritance_log;
CREATE TRIGGER trigger_escrow_inherit
AFTER INSERT ON skill_inheritance_log
FOR EACH ROW
EXECUTE FUNCTION update_escrow_on_inherit();

-- ============================================
-- 四、触发器：评价时更新好评率
-- ============================================

CREATE OR REPLACE FUNCTION update_escrow_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  -- 计算该技能的平均好评率
  SELECT AVG(rating)::decimal(3,2) INTO avg_rating
  FROM skill_reviews WHERE skill_id = NEW.skill_id;
  
  -- 更新质押表的好评率
  UPDATE skill_escrow
  SET avg_rating = COALESCE(avg_rating, 0)
  WHERE skill_id = NEW.skill_id AND status = 'held';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_escrow_rating ON skill_reviews;
CREATE TRIGGER trigger_escrow_rating
AFTER INSERT OR UPDATE ON skill_reviews
FOR EACH ROW
EXECUTE FUNCTION update_escrow_rating();

-- ============================================
-- 五、定时任务：检查过期质押（pg_cron）
-- ============================================

-- 注意：pg_cron 需要在 Supabase 中启用
-- 如果 pg_cron 不可用，可用应用层定时任务替代

-- 尝试创建定时任务（如果 pg_cron 扩展已启用）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 每天凌晨检查过期质押
    PERFORM cron.schedule(
      'check_escrow_expiry',
      '0 0 * * *',
      $cron$
      UPDATE skill_escrow
      SET status = 'expired',
          release_reason = 'expired_no_inherit'
      WHERE status = 'held'
        AND expires_at < NOW()
        AND inherits_count = 0;
      $cron$
    );
    
    -- 每天检查好评率过低的质押
    PERFORM cron.schedule(
      'check_escrow_low_rating',
      '0 1 * * *',
      $cron$
      DECLARE min_rating_val DECIMAL(3,2);
      BEGIN
        SELECT value::decimal INTO min_rating_val FROM system_config WHERE key = 'min_rating_for_release';
        
        UPDATE skill_escrow
        SET status = 'forfeited',
            release_reason = 'low_rating'
        WHERE status = 'held'
          AND expires_at < NOW()
          AND inherits_count > 0
          AND avg_rating < min_rating_val;
      END;
      $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron 不可用，忽略错误
  NULL;
END $$;

-- ============================================
-- 六、手动检查函数（API 可调用）
-- ============================================

CREATE OR REPLACE FUNCTION check_skill_escrow_status(p_skill_id UUID)
RETURNS JSONB AS $$
DECLARE
  escrow RECORD;
  result JSONB;
  min_inherits INTEGER;
  min_rating DECIMAL(3,2);
  release_on_first BOOLEAN;
BEGIN
  -- 从配置读取参数
  SELECT value::integer INTO min_inherits FROM system_config WHERE key = 'min_inherits_for_release';
  SELECT value::decimal INTO min_rating FROM system_config WHERE key = 'min_rating_for_release';
  SELECT value::boolean INTO release_on_first FROM system_config WHERE key = 'release_on_first_inherit';
  
  -- 获取质押信息
  SELECT * INTO escrow FROM skill_escrow WHERE skill_id = p_skill_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No escrow found for this skill');
  END IF;
  
  result := jsonb_build_object(
    'skill_id', p_skill_id,
    'escrow_id', escrow.id,
    'status', escrow.status,
    'escrow_points', escrow.escrow_points,
    'inherits_count', escrow.inherits_count,
    'avg_rating', escrow.avg_rating,
    'expires_at', escrow.expires_at,
    'config', jsonb_build_object(
      'min_inherits', min_inherits,
      'min_rating', min_rating,
      'release_on_first', release_on_first
    )
  );
  
  -- 判断是否可释放
  IF escrow.status = 'held' THEN
    IF release_on_first AND escrow.inherits_count >= 1 THEN
      result := result || jsonb_build_object('can_release', true, 'reason', 'first_inherit');
    ELSIF escrow.inherits_count >= min_inherits AND escrow.avg_rating >= min_rating THEN
      result := result || jsonb_build_object('can_release', true, 'reason', 'quality_passed');
    ELSIF escrow.expires_at < NOW() AND escrow.inherits_count = 0 THEN
      result := result || jsonb_build_object('can_release', false, 'reason', 'expired_no_inherit');
    ELSIF escrow.expires_at < NOW() AND escrow.avg_rating < min_rating THEN
      result := result || jsonb_build_object('can_release', false, 'reason', 'low_rating');
    ELSE
      result := result || jsonb_build_object('can_release', false, 'reason', 'pending');
    END IF;
  ELSE
    result := result || jsonb_build_object('can_release', false, 'reason', escrow.status);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 七、RLS 策略
-- ============================================

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System config readable by all" ON system_config
  FOR SELECT USING (true);

CREATE POLICY "Escrow readable by owner" ON skill_escrow
  FOR SELECT USING (owner_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Escrow insertable by authenticated" ON skill_escrow
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 八、补充表（如果不存在）
-- ============================================

-- agent_profiles 表（Agent 档案）
CREATE TABLE IF NOT EXISTS agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE,
  model TEXT,
  provider TEXT,
  points_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_api_key ON agent_profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_name ON agent_profiles(name);

-- transaction_ledger 表（交易流水）
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID REFERENCES agent_profiles(id),
  to_agent_id UUID REFERENCES agent_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- escrow, release, inherit, reward, transfer
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_from ON transaction_ledger(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_to ON transaction_ledger(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON transaction_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON transaction_ledger(created_at DESC);

-- skill_inheritance_log 表（继承日志）
CREATE TABLE IF NOT EXISTS skill_inheritance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL,
  inheritor_id UUID REFERENCES agent_profiles(id),
  points_spent DECIMAL(10,2) DEFAULT 1,
  task_success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inherit_log_skill ON skill_inheritance_log(skill_id);
CREATE INDEX IF NOT EXISTS idx_inherit_log_inheritor ON skill_inheritance_log(inheritor_id);

-- ============================================
-- 九、授权
-- ============================================

GRANT SELECT ON system_config TO anon, authenticated;
GRANT SELECT ON skill_escrow TO anon, authenticated;
GRANT INSERT ON skill_escrow TO authenticated;
GRANT USAGE ON FUNCTION check_skill_escrow_status TO anon, authenticated;
GRANT SELECT ON agent_profiles TO anon, authenticated;
GRANT INSERT ON agent_profiles TO authenticated;
GRANT SELECT ON transaction_ledger TO authenticated;
GRANT INSERT ON transaction_ledger TO authenticated;
GRANT SELECT ON skill_inheritance_log TO anon, authenticated;
GRANT INSERT ON skill_inheritance_log TO authenticated;