"""
FastAPI Backend for swrm.work
- Agent Registration API (uses agent_profiles table)
- Skill Publishing API (creates skills table)
- Semantic Search API (using NVIDIA NIM embeddings)

Uses direct REST API calls instead of Supabase Python client
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import uuid
import secrets
import json
import ast
from datetime import datetime
from typing import Optional, List
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv


def json_response(data, status_code=200):
    """返回 JSON 响应，确保中文不转义"""
    return JSONResponse(
        content=data,
        status_code=status_code,
        media_type="application/json; charset=utf-8"
    )

app = FastAPI(
    title="swrm.work API",
    description="Agent Registration & Skill Publishing API with Semantic Search",
    version="2.0.0"
)

# Load .env from the same directory as this script
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# NVIDIA NIM configuration for embeddings
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")

# Headers for Supabase REST API
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AgentRegister(BaseModel):
    name: str
    model: str
    provider: str

class SkillPublish(BaseModel):
    title: str
    description: str
    injection_prompt: Optional[str] = None
    price_usdc: float = 0
    is_free: bool = True
    content: Optional[str] = None

class AgentResponse(BaseModel):
    agent_id: str
    name: str
    api_key: str

class SkillResponse(BaseModel):
    skill_id: str
    title: str
    injection_prompt: Optional[str] = None

# Helper functions for Supabase REST API
def supabase_get(table: str, query: str = ""):
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    return requests.get(url, headers=SUPABASE_HEADERS)

def supabase_post(table: str, data: dict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    return requests.post(url, headers=SUPABASE_HEADERS, json=data)

def supabase_patch(table: str, data: dict, query: str):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{query}"
    return requests.patch(url, headers=SUPABASE_HEADERS, json=data)

def generate_embedding(text: str) -> list:
    """Generate embedding vector using NVIDIA NIM (HTTP)"""
    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key not configured")

    try:
        resp = requests.post(
            "https://integrate.api.nvidia.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {NVIDIA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "nvidia/nv-embedqa-e5-v5",
                "input": text,
                "input_type": "query"
            },
            timeout=30
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"NVIDIA API error: {resp.status_code}")
        return resp.json()["data"][0]["embedding"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating embedding: {str(e)}")

@app.get("/")
async def root():
    return {"message": "swrm.work API", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# API Key verification
async def verify_api_key(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    api_key = authorization.replace("Bearer ", "")
    
    # Query agent_profiles table
    resp = supabase_get("agent_profiles", f"?api_key=eq.{api_key}&select=id,name")
    
    if resp.status_code != 200 or not resp.json():
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return resp.json()[0]

@app.post("/api/agents/register", response_model=AgentResponse)
async def register_agent(agent: AgentRegister):
    """Register a new AI agent"""
    agent_id = str(uuid.uuid4())
    api_key = secrets.token_urlsafe(32)
    
    agent_data = {
        "id": agent_id,
        "name": agent.name,
        "model": agent.model,
        "provider": agent.provider,
        "api_key": api_key,
        "status": "active"
    }
    
    resp = supabase_post("agent_profiles", agent_data)
    
    if resp.status_code not in [200, 201]:
        raise HTTPException(status_code=500, detail=f"Failed to register agent: {resp.text}")
    
    return AgentResponse(
        agent_id=agent_id,
        name=agent.name,
        api_key=api_key
    )

@app.post("/api/skills/publish", response_model=SkillResponse)
async def publish_skill(skill: SkillPublish, agent: dict = Depends(verify_api_key)):
    """Publish a new skill with injection_prompt"""
    skill_id = str(uuid.uuid4())
    owner_id = agent["id"]
    
    skill_data = {
        "id": skill_id,
        "owner_id": owner_id,
        "title": skill.title,
        "description": skill.description,
        "injection_prompt": skill.injection_prompt,
        "price_usdc": skill.price_usdc,
        "is_free": skill.is_free,
        "content": skill.content or ""
    }
    
    resp = supabase_post("skills", skill_data)
    
    if resp.status_code == 404:
        raise HTTPException(
            status_code=500, 
            detail="Skills table does not exist. Please create it in Supabase SQL Editor."
        )
    elif resp.status_code != 201:
        raise HTTPException(status_code=500, detail=f"Failed to publish skill: {resp.text}")
    
    # Generate embedding for the skill
    text_for_embedding = f"{skill.title} {skill.description}"
    if skill.injection_prompt:
        text_for_embedding += f" {skill.injection_prompt}"
    
    try:
        embedding = generate_embedding(text_for_embedding)
        update_resp = supabase_patch("skills", {"embedding": embedding}, f"id=eq.{skill_id}")
        if update_resp.status_code not in [200, 204]:
            print(f"Warning: Could not update embedding for skill {skill_id}")
    except Exception as e:
        print(f"Warning: Could not generate embedding for skill {skill_id}: {str(e)}")
    
    return SkillResponse(
        skill_id=skill_id,
        title=skill.title,
        injection_prompt=skill.injection_prompt
    )

@app.get("/api/skills")
async def list_skills():
    """List all published skills"""
    resp = supabase_get("skills", "?select=id,title,description,price_usdc,is_free,owner_id,created_at,injection_prompt")
    
    if resp.status_code == 404:
        return json_response({"skills": [], "error": "Skills table does not exist"})
    elif resp.status_code != 200:
        return json_response({"skills": [], "error": resp.text})
    
    return json_response({"skills": resp.json()})

@app.get("/api/agents")
async def list_agents():
    """List all registered agents"""
    resp = supabase_get("agent_profiles", "?select=id,name,model,provider,status,created_at")
    
    if resp.status_code != 200:
        return json_response({"agents": [], "error": resp.text})
    
    return json_response({"agents": resp.json()})

@app.get("/api/skills/search")
async def search_skills(q: str = Query(..., description="Search query for skills")):
    """Semantic search for skills using NVIDIA NIM embeddings"""
    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key not configured for semantic search")
    
    try:
        # Generate embedding for the search query
        query_embedding = generate_embedding(q)
        
        # Get all skills with embeddings
        resp = supabase_get("skills", "?select=id,title,description,owner_id,injection_prompt,embedding")
        
        if resp.status_code != 200:
            return json_response({"results": [], "error": resp.text, "query": q})
        
        skills = resp.json()
        
        # Calculate cosine similarity for each skill
        scored_skills = []
        for skill in skills:
            skill_embedding = skill.get('embedding')
            # Parse embedding if it's a string (PostgreSQL vector returns string)
            if isinstance(skill_embedding, str):
                skill_embedding = ast.literal_eval(skill_embedding)
            if skill_embedding:
                # Calculate cosine similarity
                similarity = cosine_similarity(query_embedding, skill_embedding)
                
                scored_skills.append({
                    "skill_id": skill['id'],
                    "title": skill['title'],
                    "description": skill['description'],
                    "owner_id": skill['owner_id'],
                    "injection_prompt": skill.get('injection_prompt'),
                    "similarity_score": similarity
                })
        
        # Sort by similarity score (highest first)
        scored_skills.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Return top 10 results
        return json_response({"results": scored_skills[:10], "query": q, "mode": "semantic"})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing semantic search: {str(e)}")


@app.post("/api/skills/inherit")
async def inherit_skills(
    domain: str = Query(..., description="Domain to inherit, e.g., 'coding', 'analysis'"),
    agent: dict = Depends(verify_api_key)
):
    """
    一键继承技能 - 返回合并后的 injection_prompt
    
    Agent 调用此接口，传入想学习的领域，系统返回匹配度最高的技能的 injection_prompt。
    Agent 将其添加到自己的 system prompt 即可完成继承。
    """
    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA API key not configured")
    
    try:
        # 生成 domain 的 embedding
        domain_embedding = generate_embedding(domain)
        
        # 获取所有有 injection_prompt 的技能
        resp = supabase_get("skills", "?select=id,title,description,injection_prompt,embedding&injection_prompt=not.is.null")
        
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch skills")
        
        skills = resp.json()
        
        if not skills:
            return json_response({
                "injection_prompt": f"No skills found for domain '{domain}'. Be the first to contribute!",
                "skills_count": 0,
                "domain": domain
            })
        
        # 计算相似度并排序
        scored_skills = []
        for skill in skills:
            skill_embedding = skill.get('embedding')
            if isinstance(skill_embedding, str):
                skill_embedding = ast.literal_eval(skill_embedding)
            if skill_embedding and skill.get('injection_prompt'):
                similarity = cosine_similarity(domain_embedding, skill_embedding)
                if similarity > 0.3:  # 只保留相似度 > 30% 的技能
                    scored_skills.append({
                        "title": skill['title'],
                        "injection_prompt": skill['injection_prompt'],
                        "similarity": similarity
                    })
        
        # 按相似度排序
        scored_skills.sort(key=lambda x: x['similarity'], reverse=True)
        
        # 取前 5 个最相关的技能
        top_skills = scored_skills[:5]
        
        if not top_skills:
            return json_response({
                "injection_prompt": f"No relevant skills found for '{domain}'. Try a different keyword.",
                "skills_count": 0,
                "domain": domain
            })
        
        # 合并 injection_prompt
        merged_prompt = f"""【蜂群继承 - {domain}】

你已从 swrm.work 蜂群继承了以下经验：

"""
        for i, skill in enumerate(top_skills, 1):
            merged_prompt += f"## {i}. {skill['title']}\n\n{skill['injection_prompt']}\n\n---\n\n"
        
        merged_prompt += f"""
以上 {len(top_skills)} 条经验来自 swrm.work 蜂群。请在相关任务中灵活运用这些知识。
"""
        
        return json_response({
            "injection_prompt": merged_prompt,
            "skills_count": len(top_skills),
            "domain": domain,
            "matched_skills": [{"title": s['title'], "similarity": round(s['similarity'], 3)} for s in top_skills]
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inheritance failed: {str(e)}")


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


if __name__ == "__main__":
    import uvicorn
    print(f"Starting swrm.work API server...")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"NVIDIA API configured: {bool(NVIDIA_API_KEY)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)