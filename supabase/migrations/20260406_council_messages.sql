-- 议事厅聊天消息表
CREATE TABLE IF NOT EXISTS council_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '访客',
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS council_messages_created_at_idx ON council_messages(created_at DESC);
