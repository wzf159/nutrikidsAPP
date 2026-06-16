# NutriKids 部署指南

## 📦 项目结构

```
食品成分/
├── nutrikids/          # 前端（React + Vite + TypeScript）
└── server/             # 后端（Fastify + TypeScript + Prisma + SQLite）
```

## 🚀 服务器环境准备

### 系统要求

- Linux (Ubuntu 22.04+ 推荐)
- Node.js 20.x LTS
- npm 9.x+
- Nginx（用于反向代理）

### 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 git
sudo apt install -y git
```

## 🔧 前端部署

### 1. 克隆代码

```bash
mkdir -p /opt/nutrikids
cd /opt/nutrikids
git clone <仓库地址> .
```

### 2. 安装依赖并构建

```bash
cd nutrikids
npm install
npm run build
```

构建成功后会生成 `dist/` 目录，包含前端静态文件。

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# nutrikids/.env.local
VITE_API_BASE_URL=https://你的域名/api
```

## 🔧 后端部署

### 1. 安装依赖并构建

```bash
cd server
npm install
npm run build
npm run prisma:generate
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# server/.env
DATABASE_URL="file:./prod.db"
JWT_SECRET="生成一个很长的随机字符串"
PORT=3000
CORS_ORIGIN="https://你的域名"

# MiniMax 图片识别（可选）
MINIMAX_API_KEY="你的 API Key"
MINIMAX_BASE_URL="https://api.minimaxi.com/v1"
MINIMAX_MODEL="MiniMax-M3"
```

**生成安全的 JWT\_SECRET：**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 数据库迁移

```bash
npm run prisma:migrate
npm run seed
```

### 4. 启动服务

使用 `pm2` 管理进程：

```bash
# 安装 pm2
npm install -g pm2

# 启动后端服务
pm2 start npm --name nutrikids-server -- run start

# 设置开机自启
pm2 startup
pm2 save
```

**常用 pm2 命令：**

```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart nutrikids-server  # 重启服务
pm2 stop nutrikids-server     # 停止服务
```

## 🔧 Nginx 配置

### 创建配置文件

```bash
sudo nano /etc/nginx/sites-available/nutrikids
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /opt/nutrikids/nutrikids/dist;
    index index.html;

    # React Router 路由重写
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/nutrikids /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 SSL 证书配置（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

## 📋 部署检查清单

| 项目 | 检查内容                                     |
| -- | ---------------------------------------- |
| ✅  | Node.js 20.x 已安装                         |
| ✅  | 前端 `npm run build` 成功，`dist/` 目录存在       |
| ✅  | 后端 `npm run build` 成功，`dist/index.js` 存在 |
| ✅  | `.env.local` 中 `VITE_API_BASE_URL` 配置正确  |
| ✅  | `.env` 中 `JWT_SECRET` 已更换为安全密钥           |
| ✅  | `.env` 中 `CORS_ORIGIN` 配置为前端域名           |
| ✅  | 数据库已迁移，`prod.db` 已创建                     |
| ✅  | 后端用 pm2 启动，进程状态正常                        |
| ✅  | Nginx 配置正确，包含 API 代理                     |
| ✅  | SSL 证书已配置（HTTPS）                         |

## 🚀 启动验证

```bash
# 检查后端健康状态
curl http://localhost:8787/health
# 预期输出: {"ok":true}

# 检查前端是否可访问
curl -I http://your-domain.com
# 预期状态码: 200
```

## 📁 文件备份

### 备份数据库

```bash
# 停止服务
pm2 stop nutrikids-server

# 备份数据库
cp /opt/nutrikids/server/prod.db /opt/nutrikids/server/prod.db.backup.$(date +%Y%m%d)

# 重启服务
pm2 start nutrikids-server
```

### 定期自动备份（可选）

创建 cron 任务：

```bash
crontab -e
```

添加：

```bash
0 2 * * * pm2 stop nutrikids-server && cp /opt/nutrikids/server/prod.db /opt/nutrikids/server/prod.db.backup.$(date +\%Y\%m\%d) && pm2 start nutrikids-server
```

## 🔄 更新部署

```bash
cd /opt/nutrikids
git pull origin main

# 更新前端
cd nutrikids
npm install
npm run build

# 更新后端
cd ../server
npm install
npm run build
npm run prisma:migrate
pm2 restart nutrikids-server

# 重启 Nginx（如果配置有变更）
sudo systemctl reload nginx
```

## ⚠️ 注意事项

1. **安全**：`JWT_SECRET` 必须使用高强度随机字符串，切勿使用默认值
2. **CORS**：`CORS_ORIGIN` 必须设置为前端实际域名，不要使用 `*`
3. **数据库**：SQLite 数据库文件需要定期备份
4. **端口**：确保防火墙开放 80/443 端口，8787 端口仅本地访问
5. **进程管理**：使用 pm2 确保后端服务稳定运行，避免终端关闭后服务停止

## 📞 故障排查

### 后端日志

```bash
pm2 logs nutrikids-server --lines 100
```

### Nginx 日志

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 常见问题

| 问题       | 解决方案                                  |
| -------- | ------------------------------------- |
| 前端页面空白   | 检查 Nginx 配置中 `root` 路径是否指向 `dist/` 目录 |
| API 请求失败 | 检查后端是否启动，Nginx 代理配置是否正确               |
| 数据库连接失败  | 检查 `DATABASE_URL` 路径，确保目录有写入权限        |
| 跨域错误     | 检查 `CORS_ORIGIN` 是否与前端域名一致            |

