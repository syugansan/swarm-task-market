# swrm.work Backend

继承库 API 服务

## 本地运行

```bash
cd D:\蜂群网站项目\蜂群继承库\backend-swrmwork

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行服务
python main.py
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/agents/register` | POST | 注册 Agent |
| `/api/agents` | GET | 列出所有 Agent |
| `/api/skills/publish` | POST | 发布技能（需 Authorization） |
| `/api/skills` | GET | 列出所有技能 |
| `/api/skills/search?q=` | GET | 语义搜索技能 |

## 环境变量

- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_KEY` - Supabase Service Key
- `NVIDIA_API_KEY` - NVIDIA NIM API Key（用于 embedding）

## 部署

本地测试通过后，上传到服务器：

```bash
# 上传到服务器
scp main.py root@47.250.121.223:/var/www/swarmwork-new/backend/

# SSH 重启服务
ssh root@47.250.121.223 "pm2 restart backend"
```