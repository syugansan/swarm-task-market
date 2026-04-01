import psycopg2

conn = psycopg2.connect(
    host='db.agoismqarzchkszihysr.supabase.co',
    port=5432,
    database='postgres',
    user='postgres',
    password='Zg233635'
)
conn.autocommit = True
cur = conn.cursor()

print('Connected to Supabase')

# Part 1: Tables
sql1 = """
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value, value_type, description) VALUES
('escrow_amount', '1', 'number', 'escrow points'),
('escrow_days', '30', 'number', 'escrow days'),
('min_inherits_for_release', '1', 'number', 'min inherits'),
('min_rating_for_release', '3.5', 'number', 'min rating'),
('release_on_first_inherit', 'true', 'boolean', 'release on first inherit')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS transaction_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID,
  to_agent_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_inheritance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL,
  inheritor_id UUID,
  points_spent DECIMAL(10,2) DEFAULT 1,
  task_success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL,
  reviewer_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_review UNIQUE (skill_id, reviewer_id)
);

ALTER TABLE skill_escrow ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE skill_escrow ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE skill_escrow ADD COLUMN IF NOT EXISTS release_reason TEXT;
ALTER TABLE skill_escrow ADD COLUMN IF NOT EXISTS inherits_count INTEGER DEFAULT 0;
ALTER TABLE skill_escrow ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
"""

try:
    cur.execute(sql1)
    print('Tables created successfully')
except Exception as e:
    print(f'Tables error: {e}')

# Part 2: Trigger
sql2 = """
CREATE OR REPLACE FUNCTION update_escrow_on_inherit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE skill_escrow
  SET inherits_count = inherits_count + 1
  WHERE skill_id = NEW.skill_id AND status = 'held';

  IF (SELECT value FROM system_config WHERE key = 'release_on_first_inherit') = 'true' THEN
    UPDATE skill_escrow
    SET status = 'released', release_reason = 'first_inherit', released_at = NOW()
    WHERE skill_id = NEW.skill_id AND status = 'held' AND inherits_count = 1;

    INSERT INTO transaction_ledger (from_agent_id, to_agent_id, amount, transaction_type, reference_id, description)
    SELECT NULL, se.owner_id, se.escrow_points, 'release', NEW.skill_id, 'First inheritance release'
    FROM skill_escrow se WHERE se.skill_id = NEW.skill_id AND se.release_reason = 'first_inherit';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_escrow_inherit ON skill_inheritance_log;
CREATE TRIGGER trigger_escrow_inherit
AFTER INSERT ON skill_inheritance_log
FOR EACH ROW EXECUTE FUNCTION update_escrow_on_inherit();
"""

try:
    cur.execute(sql2)
    print('Trigger created successfully')
except Exception as e:
    print(f'Trigger error: {e}')

# Verify
cur.execute("SELECT key, value FROM system_config")
print('\n=== system_config ===')
for row in cur.fetchall():
    print(f'  {row[0]}: {row[1]}')

cur.execute("SELECT COUNT(*) FROM skill_escrow")
print(f'\nskill_escrow count: {cur.fetchone()[0]}')

cur.close()
conn.close()
print('\nMigration complete!')