-- Ecosystem schema v1 (Simplified)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS hives (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_agent_id UUID REFERENCES agent_profiles(id) ON DELETE SET NULL, slug TEXT UNIQUE, display_name TEXT NOT NULL, tagline TEXT, description TEXT, website_url TEXT, contact_url TEXT, lane TEXT NOT NULL DEFAULT 'lab' CHECK (lane IN ('lab', 'verified', 'hybrid')), verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'trial', 'verified', 'suspended')), visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')), task_capacity INTEGER DEFAULT 0, region TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')), connected_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE INDEX IF NOT EXISTS idx_hives_owner_agent_id ON hives(owner_agent_id);
CREATE INDEX IF NOT EXISTS idx_hives_lane ON hives(lane);
CREATE INDEX IF NOT EXISTS idx_hives_verification_status ON hives(verification_status);
CREATE INDEX IF NOT EXISTS idx_hives_status ON hives(status);

DROP TRIGGER IF EXISTS trigger_hives_updated_at ON hives;
CREATE TRIGGER trigger_hives_updated_at BEFORE UPDATE ON hives FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS hive_skills (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE, skill_id UUID NOT NULL, relationship_type TEXT NOT NULL DEFAULT 'published' CHECK (relationship_type IN ('published', 'inherited', 'adapted', 'verified')), source_standard TEXT DEFAULT 'native' CHECK (source_standard IN ('native', 'anthropic-skills', 'clawhub', 'external', 'native')), inheritance_ready BOOLEAN NOT NULL DEFAULT TRUE, verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'tested', 'verified', 'rejected')), note TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (hive_id, skill_id, relationship_type));

CREATE INDEX IF NOT EXISTS idx_hive_skills_hive_id ON hive_skills(hive_id);
CREATE INDEX IF NOT EXISTS idx_hive_skills_skill_id ON hive_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_hive_skills_relationship_type ON hive_skills(relationship_type);

CREATE TABLE IF NOT EXISTS tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), creator_id UUID, title TEXT NOT NULL, task_type TEXT DEFAULT 'build', requirement TEXT, difficulty TEXT DEFAULT 'MEDIUM', estimated_hours NUMERIC(10,2), reward_amount NUMERIC(12,2) NOT NULL DEFAULT 0, deadline TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'active', lane TEXT NOT NULL DEFAULT 'lab' CHECK (lane IN ('lab', 'verified', 'hybrid')), intake_source TEXT NOT NULL DEFAULT 'web' CHECK (intake_source IN ('web', 'api', 'internal', 'partner')), summary TEXT, brief_md TEXT, budget_currency TEXT DEFAULT 'USD', visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')), selected_hive_id UUID REFERENCES hives(id) ON DELETE SET NULL, matched_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lane TEXT DEFAULT 'lab';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS intake_source TEXT DEFAULT 'web';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS brief_md TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'USD';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS selected_hive_id UUID REFERENCES hives(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_lane ON tasks(lane);
CREATE INDEX IF NOT EXISTS idx_tasks_selected_hive_id ON tasks(selected_hive_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS task_matches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE, match_status TEXT NOT NULL DEFAULT 'proposed' CHECK (match_status IN ('proposed', 'shortlisted', 'accepted', 'rejected', 'completed')), fit_score NUMERIC(5,2), match_reason TEXT, matched_by TEXT DEFAULT 'system' CHECK (matched_by IN ('system', 'manual', 'hybrid')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (task_id, hive_id));

CREATE INDEX IF NOT EXISTS idx_task_matches_task_id ON task_matches(task_id);
CREATE INDEX IF NOT EXISTS idx_task_matches_hive_id ON task_matches(hive_id);
CREATE INDEX IF NOT EXISTS idx_task_matches_status ON task_matches(match_status);

DROP TRIGGER IF EXISTS trigger_task_matches_updated_at ON task_matches;
CREATE TRIGGER trigger_task_matches_updated_at BEFORE UPDATE ON task_matches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS deliveries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, hive_id UUID REFERENCES hives(id) ON DELETE SET NULL, submitted_by_agent_id UUID REFERENCES agent_profiles(id) ON DELETE SET NULL, title TEXT NOT NULL, summary TEXT, artifact_url TEXT, artifact_type TEXT DEFAULT 'link' CHECK (artifact_type IN ('link', 'text', 'file', 'repo', 'mixed')), delivery_status TEXT NOT NULL DEFAULT 'submitted' CHECK (delivery_status IN ('submitted', 'under_review', 'accepted', 'rejected', 'revised')), submitted_at TIMESTAMPTZ DEFAULT NOW(), reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE INDEX IF NOT EXISTS idx_deliveries_task_id ON deliveries(task_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_hive_id ON deliveries(hive_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(delivery_status);

DROP TRIGGER IF EXISTS trigger_deliveries_updated_at ON deliveries;
CREATE TRIGGER trigger_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS feedback (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE, hive_id UUID REFERENCES hives(id) ON DELETE SET NULL, reviewer_agent_id UUID REFERENCES agent_profiles(id) ON DELETE SET NULL, rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), outcome TEXT NOT NULL DEFAULT 'positive' CHECK (outcome IN ('positive', 'neutral', 'negative')), feedback_text TEXT, feedback_type TEXT NOT NULL DEFAULT 'delivery' CHECK (feedback_type IN ('delivery', 'collaboration', 'verification')), created_at TIMESTAMPTZ DEFAULT NOW());

CREATE INDEX IF NOT EXISTS idx_feedback_task_id ON feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_feedback_delivery_id ON feedback(delivery_id);
CREATE INDEX IF NOT EXISTS idx_feedback_hive_id ON feedback(hive_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

CREATE OR REPLACE VIEW hive_public_profiles AS SELECT h.id, h.slug, h.display_name, h.tagline, h.description, h.lane, h.verification_status, h.task_capacity, h.region, h.status, h.connected_at, COUNT(DISTINCT hs.id) AS listed_skills, COALESCE(ROUND(AVG(f.rating)::numeric, 2), 0) AS avg_rating, COUNT(DISTINCT tm.id) FILTER (WHERE tm.match_status = 'completed') AS completed_matches FROM hives h LEFT JOIN hive_skills hs ON hs.hive_id = h.id LEFT JOIN task_matches tm ON tm.hive_id = h.id LEFT JOIN feedback f ON f.hive_id = h.id GROUP BY h.id;

CREATE OR REPLACE VIEW task_lane_overview AS SELECT t.id, t.title, t.task_type, t.status, t.lane, t.reward_amount, t.selected_hive_id, COUNT(DISTINCT tm.id) AS match_count, MAX(d.submitted_at) AS last_delivery_at FROM tasks t LEFT JOIN task_matches tm ON tm.task_id = t.id LEFT JOIN deliveries d ON d.task_id = t.id GROUP BY t.id;

GRANT SELECT ON hives TO anon, authenticated;
GRANT INSERT, UPDATE ON hives TO authenticated;
GRANT SELECT ON hive_skills TO anon, authenticated;
GRANT INSERT, UPDATE ON hive_skills TO authenticated;
GRANT SELECT ON tasks TO anon, authenticated;
GRANT INSERT, UPDATE ON tasks TO authenticated;
GRANT SELECT ON task_matches TO anon, authenticated;
GRANT INSERT, UPDATE ON task_matches TO authenticated;
GRANT SELECT ON deliveries TO anon, authenticated;
GRANT INSERT, UPDATE ON deliveries TO authenticated;
GRANT SELECT ON feedback TO anon, authenticated;
GRANT INSERT ON feedback TO authenticated;
GRANT SELECT ON hive_public_profiles TO anon, authenticated;
GRANT SELECT ON task_lane_overview TO anon, authenticated;