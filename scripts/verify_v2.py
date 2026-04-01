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
print("FULL VERIFICATION - Escrow + Inheritance + Q-Score")
print("=" * 60)

# 1. Check system_config
print("\n1. system_config:")
r = requests.get(f"{SUPABASE_URL}/rest/v1/system_config?select=*", headers=headers)
configs = r.json() if r.status_code == 200 else []
for c in configs:
    print(f"   {c['key']}: {c['value']}")

# 2. Get agents
print("\n2. Getting agents...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/agent_profiles?select=id,name&limit=5", headers=headers)
agents = r.json() if r.status_code == 200 else []
print(f"   Found {len(agents)} agents")
agent1_id = agents[0]['id'] if len(agents) > 0 else None
agent2_id = agents[1]['id'] if len(agents) > 1 else None

# 3. Get existing skill
print("\n3. Getting existing skill...")
r = requests.get(f"{SUPABASE_URL}/rest/v1/skills?select=id,title,owner_id,inherit_count&limit=1", headers=headers)
skills = r.json() if r.status_code == 200 else []
if skills:
    skill_id = skills[0]['id']
    print(f"   Using skill: {skill_id} ({skills[0].get('title', 'N/A')})")
else:
    print("   No skills found!")
    skill_id = None

# 4. Create escrow for skill
if skill_id and agent1_id:
    print("\n4. Creating escrow...")
    escrow_data = {
        "skill_id": skill_id,
        "owner_id": agent1_id,
        "escrow_points": 1,
        "status": "held"
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/skill_escrow", headers=headers, json=escrow_data)
    if r.status_code == 201:
        print(f"   Created escrow for skill {skill_id[:8]}...")
    else:
        print(f"   Escrow result: {r.status_code}")
        if "duplicate" in r.text.lower() or "unique" in r.text.lower():
            print("   (Escrow already exists, continuing...)")

# 5. Check escrow before inherit
print("\n5. Escrow status BEFORE inheritance:")
r = requests.get(f"{SUPABASE_URL}/rest/v1/skill_escrow?select=*&skill_id=eq.{skill_id}", headers=headers)
escrows = r.json() if r.status_code == 200 else []
for e in escrows:
    print(f"   status={e.get('status')} inherits={e.get('inherits_count',0)} reason={e.get('release_reason','N/A')}")

# 6. Create inheritance log
if skill_id and agent2_id:
    print("\n6. Creating inheritance log (triggers escrow release)...")
    inherit_data = {
        "skill_id": skill_id,
        "inheritor_id": agent2_id,
        "points_spent": 1,
        "task_success": True
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/skill_inheritance_log", headers=headers, json=inherit_data)
    print(f"   Result: {r.status_code}")
    if r.status_code == 201:
        print("   Inheritance log created!")

# 7. Check escrow AFTER inherit
print("\n7. Escrow status AFTER inheritance:")
r = requests.get(f"{SUPABASE_URL}/rest/v1/skill_escrow?select=*&skill_id=eq.{skill_id}", headers=headers)
escrows = r.json() if r.status_code == 200 else []
for e in escrows:
    print(f"   status={e.get('status')} inherits={e.get('inherits_count',0)} reason={e.get('release_reason','N/A')}")

# 8. Check transaction ledger
print("\n8. Transaction ledger:")
r = requests.get(f"{SUPABASE_URL}/rest/v1/transaction_ledger?select=*&order=created_at.desc&limit=5", headers=headers)
if r.status_code == 200:
    txs = r.json()
    print(f"   Found {len(txs)} transactions:")
    for t in txs:
        print(f"   - type={t.get('transaction_type')} amount={t.get('amount')} desc={t.get('description','')[:40]}")
else:
    print(f"   ERROR: {r.status_code}")

# 9. Calculate Q-scores
print("\n9. Q-Score calculation:")
for agent in agents[:5]:
    # Get skills published
    r = requests.get(f"{SUPABASE_URL}/rest/v1/skills?select=id,inherit_count&owner_id=eq.{agent['id']}", headers=headers)
    skills_owned = r.json() if r.status_code == 200 else []
    total_inherits = sum(s.get('inherit_count', 0) for s in skills_owned)
    
    # Get earnings
    r = requests.get(f"{SUPABASE_URL}/rest/v1/transaction_ledger?select=amount&to_agent_id=eq.{agent['id']}&transaction_type=in.(reward,release)", headers=headers)
    earnings = r.json() if r.status_code == 200 else []
    total_earned = sum(e.get('amount', 0) for e in earnings)
    
    q_score = total_inherits * 10 + total_earned * 5
    if q_score > 0 or total_inherits > 0 or total_earned > 0:
        print(f"   {agent['name']}: inherits={total_inherits} earned={total_earned} Q={q_score}")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)