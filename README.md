# CJ-ATPlist

Amazon 联盟营销商品推荐平台

## 馂述

CJ-ATPlist 是一个 Amazon 联盟营销商品推荐平台，包含：
- Chrome 扩展采集 Amazon 商品数据
- 管理后台（Vue 3 + Element Plus）管理商品和推荐合集
- 公开推荐站（SEO 友好）
- API Key 认证（供外部工具调用）

- Docker 一键部署

## 鵍🇯 部署

### 服务器部署（Docker + 1Panel）

**1. 在服务器上克隆仓库：**
```bash
cd /opt/1panel/apps/CJ-ATPlist
git clone https://github.com/Selei1983/-CJ-ATPlist.git .
```

**2. 创建环境变量文件：**
```bash
cat > .env << 'EOF'
JWT_SECRET=替换为一段随机字符串至少32位
EOF
```

**3. 构建并启动：**
```bash
docker compose up -d --build
```

**4. 验证服务：**
```bash
curl http://localhost:3001/api/health
```

**5. 1Panel 反向代理设置：**
- 网站 → 创建网站 → 反向代理
- 域名： `atplist.yourdomain.com`
- 代理地址： `http://127.0.0.1:3001`
- 开启 HTTPS（申请 Let's Encrypt SSL 证书）
- 保存

**6. 访问：**
- 公开站：`https://atplist.yourdomain.com/site/`
- 管理后台：`https://atplist.yourdomain.com/admin/`
- API：`https://atplist.yourdomain.com/api/health`

第一个注册的用户自动成为 admin。

### 常用运维命令
```bash
# 更新部署
cd /opt/1panel/apps/CJ-ATPlist
git pull
docker compose up -d --build

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 数据备份
cp -r ./data ./data-backup-$(date +%Y%m%d)
```

## 本地开发
```bash
cd server
npm install
node src/index.js
```

在另一个终端启动 admin 开发服务器：
```bash
cd admin
npm install
npm run dev
```

## 项目结构
```
server/          # Express 后端 API
├── src/
│   ├── index.js        # 入口
│   ├── database.js    # sql.js 数据库
│   ├── middleware/    # JWT 认证
│   ├── models/        # 数据模型
│   └── routes/        # API 路由
admin/           # Vue 3 管理后台
├── src/
│   ├── views/        # 页面组件
│   ├── api/          # API 调用
│   ├── stores/       # Pinia 状态管理
│   └── router/        # Vue Router
site/            # 公开推荐站
└── dist/
    └── index.html
extension/        # Chrome 扩展
├── sidebar.js      # 侧边栏
├── scripts/
│   └── content.js   # Amazon 页面数据采集
```

## 技术栈
- Node.js + Express
- sql.js（纯 JS SQLite）
- Vue 3 + Vite + Element Plus
- Pinia + Vue Router
- JWT + bcryptjs
- Docker 部署
