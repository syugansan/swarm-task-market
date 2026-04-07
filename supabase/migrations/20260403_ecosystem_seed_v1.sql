-- Ecosystem seed v1
-- Date: 2026-04-03
-- Goal: provide a minimal living dataset for hives, task routing, deliveries, and feedback.

-- ============================================================
-- 1. Hives
-- ============================================================

INSERT INTO hives (
  id,
  slug,
  display_name,
  tagline,
  description,
  lane,
  verification_status,
  visibility,
  task_capacity,
  region,
  status
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'signal-foundry',
    'Signal Foundry',
    'Strategy, research, and signal shaping for swarm teams.',
    'A public-facing hive focused on research synthesis, positioning work, and strategic narrative passes.',
    'verified',
    'verified',
    'public',
    6,
    'Global',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'interface-garden',
    'Interface Garden',
    'Frontend execution and interaction systems.',
    'A hive focused on product surfaces, implementation details, and shipping clean responsive interfaces.',
    'verified',
    'verified',
    'public',
    8,
    'Asia',
    'active'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'trial-lantern',
    'Trial Lantern',
    'Public test capacity for new swarm entrants.',
    'An entry-lane hive building trial records through smaller public tasks and transparent delivery loops.',
    'lab',
    'trial',
    'public',
    4,
    'Remote',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  lane = EXCLUDED.lane,
  verification_status = EXCLUDED.verification_status,
  visibility = EXCLUDED.visibility,
  task_capacity = EXCLUDED.task_capacity,
  region = EXCLUDED.region,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================
-- 2. Hive skill links
-- ============================================================
-- Attach the first few active skills to the seeded hives without assuming fixed skill ids.

WITH ranked_skills AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM skills
  WHERE status IN ('active', 'approved')
)
INSERT INTO hive_skills (hive_id, skill_id, relationship_type, source_standard, inheritance_ready, verification_status, note)
SELECT mapping.hive_id, rs.id, mapping.relationship_type, mapping.source_standard, true, mapping.verification_status, mapping.note
FROM ranked_skills rs
JOIN (
  VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, 1, 'published', 'native', 'verified', 'Core research synthesis skill'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 2, 'adapted', 'anthropic-skills', 'tested', 'Adapted strategic writing pattern'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 3, 'published', 'native', 'verified', 'Frontend implementation pattern'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 4, 'adapted', 'clawhub', 'tested', 'Imported interface workflow'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 5, 'inherited', 'external', 'pending', 'Entry-lane inherited capability')
) AS mapping(hive_id, rn, relationship_type, source_standard, verification_status, note)
  ON mapping.rn = rs.rn
ON CONFLICT (hive_id, skill_id, relationship_type) DO NOTHING;

-- ============================================================
-- 3. Tasks
-- ============================================================

INSERT INTO tasks (
  id,
  title,
  task_type,
  requirement,
  difficulty,
  reward_amount,
  estimated_hours,
  status,
  lane,
  intake_source,
  summary,
  visibility,
  selected_hive_id,
  matched_at,
  started_at,
  completed_at
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'Refine SWRM landing page ecosystem narrative',
    'content',
    'Shift homepage messaging away from platform dominance and toward a shared ecosystem framing that invites hive participation.',
    'MEDIUM',
    280,
    10,
    'completed',
    'verified',
    'web',
    'Homepage copy and structure alignment for the new ecosystem narrative.',
    'public',
    '11111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Build responsive chamber page prototype',
    'build',
    'Create a chamber page that makes direction discussable, traceable, and reviewable without falling into empty governance theatre.',
    'HARD',
    420,
    16,
    'in_progress',
    'verified',
    'web',
    'Responsive chamber implementation and interaction cleanup.',
    'public',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '16 hours',
    NULL
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Trial swarm for creator onboarding flow',
    'analysis',
    'Test a lightweight onboarding flow for external hive operators and capture friction before the verified lane handoff.',
    'EASY',
    90,
    5,
    'active',
    'lab',
    'partner',
    'Entry-lane test task for onboarding and feedback collection.',
    'public',
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '3 hours',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  task_type = EXCLUDED.task_type,
  requirement = EXCLUDED.requirement,
  difficulty = EXCLUDED.difficulty,
  reward_amount = EXCLUDED.reward_amount,
  estimated_hours = EXCLUDED.estimated_hours,
  status = EXCLUDED.status,
  lane = EXCLUDED.lane,
  intake_source = EXCLUDED.intake_source,
  summary = EXCLUDED.summary,
  visibility = EXCLUDED.visibility,
  selected_hive_id = EXCLUDED.selected_hive_id,
  matched_at = EXCLUDED.matched_at,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at,
  updated_at = NOW();

-- ============================================================
-- 4. Task matches
-- ============================================================

INSERT INTO task_matches (
  id,
  task_id,
  hive_id,
  match_status,
  fit_score,
  match_reason,
  matched_by
)
VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'completed',
    96.50,
    'Strong fit for strategic narrative work and positioning refinement.',
    'hybrid'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'accepted',
    94.20,
    'Best fit for responsive implementation and interface cleanup.',
    'hybrid'
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    'accepted',
    88.40,
    'Entry-lane test capacity matched with onboarding experimentation work.',
    'system'
  ),
  (
    '77777777-7777-7777-7777-777777777774',
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'shortlisted',
    72.10,
    'Strategic backup option if the trial lane needs a verified fallback.',
    'system'
  )
ON CONFLICT (id) DO UPDATE SET
  match_status = EXCLUDED.match_status,
  fit_score = EXCLUDED.fit_score,
  match_reason = EXCLUDED.match_reason,
  matched_by = EXCLUDED.matched_by,
  updated_at = NOW();

-- ============================================================
-- 5. Deliveries
-- ============================================================

INSERT INTO deliveries (
  id,
  task_id,
  hive_id,
  title,
  summary,
  artifact_url,
  artifact_type,
  delivery_status,
  submitted_at,
  reviewed_at
)
VALUES
  (
    '88888888-8888-8888-8888-888888888881',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Narrative rewrite package',
    'Delivered a homepage copy pass that removed platform-dominant language and reframed SWRM as a shared ecosystem.',
    'https://swrm.work/mock-deliveries/narrative-pass',
    'repo',
    'accepted',
    NOW() - INTERVAL '3 days 6 hours',
    NOW() - INTERVAL '3 days'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'Responsive chamber prototype',
    'Submitted the first working chamber surface with mobile cleanup pending on a few interaction states.',
    'https://swrm.work/mock-deliveries/chamber-prototype',
    'repo',
    'under_review',
    NOW() - INTERVAL '10 hours',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  artifact_url = EXCLUDED.artifact_url,
  artifact_type = EXCLUDED.artifact_type,
  delivery_status = EXCLUDED.delivery_status,
  submitted_at = EXCLUDED.submitted_at,
  reviewed_at = EXCLUDED.reviewed_at,
  updated_at = NOW();

-- ============================================================
-- 6. Feedback
-- ============================================================

INSERT INTO feedback (
  id,
  task_id,
  delivery_id,
  hive_id,
  rating,
  outcome,
  feedback_text,
  feedback_type
)
VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    '44444444-4444-4444-4444-444444444444',
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    5,
    'positive',
    'The copy now feels collaborative rather than top-down. The ecosystem framing is clearer and less adversarial.',
    'delivery'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '55555555-5555-5555-5555-555555555555',
    '88888888-8888-8888-8888-888888888882',
    '22222222-2222-2222-2222-222222222222',
    4,
    'positive',
    'Implementation quality is strong. A final mobile pass and CTA consistency check are still needed before sign-off.',
    'delivery'
  ),
  (
    '99999999-9999-9999-9999-999999999993',
    '66666666-6666-6666-6666-666666666666',
    NULL,
    '33333333-3333-3333-3333-333333333333',
    4,
    'neutral',
    'Good early signal from the trial lane. Onboarding flow still needs clearer expectations for outside hive operators.',
    'verification'
  )
ON CONFLICT (id) DO NOTHING;
