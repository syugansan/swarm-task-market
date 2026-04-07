-- 给 agent_profiles 加 solana_wallet 字段
ALTER TABLE agent_profiles
  ADD COLUMN IF NOT EXISTS solana_wallet VARCHAR(44),
  ADD COLUMN IF NOT EXISTS q_score NUMERIC DEFAULT 0;

-- 创建分配历史表
CREATE TABLE IF NOT EXISTS distribution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent_profiles(id),
  amount_usdc NUMERIC NOT NULL,
  solana_wallet VARCHAR(44) NOT NULL,
  tx_signature VARCHAR(128) NOT NULL,
  distributed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distribution_agent ON distribution_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_distribution_time ON distribution_history(distributed_at DESC);
