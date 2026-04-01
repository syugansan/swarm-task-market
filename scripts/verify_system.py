import requests
import json

SUPABASE_URL = "https://agoismqarzchkszihysr.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

print("=" * 60)
print("VERIFICATION TEST - Escrow + Inheritance + Q-Score")
print("=" * 60)

# 1. Check system_config
print("\n1. Checking system_config...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/system_config?select=*", headers=headers)
if r.status_code == 200:
    configs = r.json()
    print(f"   Found {len(configs)} config entries:")
    for c in configs:
        print(f"   - {c['key']}: {c['value']}")
else:
    print(f"   ERROR: {r.status_code} - {r.text}")

# 2. Get existing agents
print("\n2. Getting test agents...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/agent_profiles?select=id,name&limit=3", headers=headers)
agents = r.json() if r.status_code == 200 else []
print(f"   Found {len(agents)} agents")
for a in agents:
    print(f"   - {a['name']}: {a['id']}")

# 3. Create test skill
print("\n3. Creating test skill...")
if len(agents) >= 1:
    test_skill = {
        "title": "Test Skill for Escrow",
        "description": "A test skill to verify escrow mechanism",
        "category": "test",
        "price": 1,
        "is_free": False,
        "publisher_id": agents[0]['id'],
        "publisher_name": agents[0]['name'],
        "status": "approved"
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/skills", headers=headers, json=test_skill)
    if r.status_code == 201:
        skill = r.json()[0]
        skill_id = skill['skill_id'] if 'skill_id' in skill else skill.get('id')
        print(f"   Created skill: {skill_id}")
    else:
        # Try to get existing skill
        r = requests.get(f"{SUPABASE_URL}/rest/v1/skills?select=skill_id,title&limit=1", headers=headers)
        if r.status_code == 200 and r.json():
            skill_id = r.json()[0]['skill_id']
            print(f"   Using existing skill: {skill_id}")
        else:
            print(f"   ERROR creating skill: {r.status_code} - {r.text}")
            skill_id = None
else:
    print("   No agents found, skipping skill creation")
    skill_id = None

# 4. Create escrow
if skill_id and len(agents) >= 1:
    print("\n4. Creating escrow...")
    escrow = {
        "skill_id": skill_id,
        "owner_id": agents[0]['id'],
        "escrow_points": 1,
        "status": "held"
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/skill_escrow", headers=headers, json=escrow)
    if r.status_code == 201:
        print(f"   Created escrow for skill {skill_id}")
    else:
        print(f"   Escrow result: {r.status_code} - {r.text[:200]}")

# 5. Create inheritance log
if skill_id and len(agents) >= 2:
    print("\n5. Creating inheritance log (should trigger escrow release)...")
    inherit = {
        "skill_id": skill_id,
        "inheritor_id": agents[1]['id'],
        "points_spent": 1,
        "task_success": True
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/skill_inheritance_log", headers=headers, json=inherit)
    if r.status_code == 201:
        print(f"   Created inheritance log")
    else:
        print(f"   Inheritance result: {r.status_code} - {r.text[:200]}")

# 6. Check escrow status
print("\n6. Checking escrow status...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/skill_escrow?select=*", headers=headers)
if r.status_code == 200:
    escrows = r.json()
    print(f"   Found {len(escrows)} escrow records:")
    for e in escrows:
        print(f"   - skill: {e.get('skill_id', 'N/A')[:8]}... status: {e.get('status')} inherits: {e.get('inherits_count', 0)} reason: {e.get('release_reason', 'N/A')}")

# 7. Check transaction ledger
print("\n7. Checking transaction_ledger...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/transaction_ledger?select=*&order=created_at.desc&limit=5", headers=headers)
if r.status_code == 200:
    txs = r.json()
    print(f"   Found {len(txs)} transactions:")
    for t in txs:
        print(f"   - type: {t.get('transaction_type')} amount: {t.get('amount')} desc: {t.get('description', 'N/A')[:40]}")
else:
    print(f"   ERROR: {r.status_code} - {r.text[:200]}")

# 8. Check Q-score via API
print("\n8. Checking Q-score leaderboard...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/agent_profiles?select=id,name", headers=headers)
if r.status_code == 200:
    all_agents = r.json()
    print(f"   Total agents: {len(all_agents)}")
    
    # Calculate Q-scores manually
    for agent in all_agents[:5]:
        # Get skills
        r2 = requests.get(f"{SUPABASE_URL}/rest/v1/skills?select=skill_id,inherit_count&publisher_id=eq.{agent['id']}", headers=headers)
        skills = r2.json() if r2.status_code == 200 else []
        total_inherits = sum(s.get('inherit_count', 0) for s in skills)
        
        # Get earnings
        r3 = requests.get(f"{SUPABASE_URL}/rest/v1/transaction_ledger?select=amount&to_agent_id=eq.{agent['id']}&transaction_type=in.(reward,release)", headers=headers)
        txs = r3.json() if r3.status_code == 200 else []
        total_earned = sum(t.get('amount', 0) for t in txs)
        
        q_score = total_inherits * 10 + total_earned * 5
        if q_score > 0 or total_inherits > 0 or total_earned > 0:
            print(f"   - {agent['name']}: inherits={total_inherits} earned={total_earned} Q={q_score}")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)