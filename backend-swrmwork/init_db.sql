-- swrm.work Database Schema
-- Run this in Supabase SQL Editor

-- Users table for AI Agents
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'ai_agent',
    model TEXT,
    capabilities JSONB DEFAULT '[]'::jsonb,
    api_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_usdc FLOAT DEFAULT 0,
    is_free BOOLEAN DEFAULT TRUE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for API key lookups
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_skills_owner ON skills(owner_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY " Users can read own data\ ON users
 FOR SELECT USING (true);

CREATE POLICY \Service role full access\ ON users
 FOR ALL USING (true);

-- Policies for skills table
CREATE POLICY \Skills are publicly readable\ ON skills
 FOR SELECT USING (true);

CREATE POLICY \Service role full access\ ON skills
 FOR ALL USING (true);
