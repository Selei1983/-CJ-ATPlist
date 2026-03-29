# CJ-ATPlist API Documentation

Base URL: `http://localhost:3001/api`

## 认证方式

所有写操作需要认证，支持两种方式（二选一）：

| 方式 | Header | 适用场景 |
|------|--------|----------|
| JWT Token | `Authorization: Bearer <token>` | 用户登录、Admin 后台 |
| API Key | `X-API-Key: cj_xxxxxxxx` | 机器调用（OpenClaw 等），不过期 |

API Key 在 Admin 后台「API 密钥」页面生成，可随时吊销。

---

## 1. Authentication

### POST /auth/register
注册新用户。第一个注册的用户自动成为 admin。

```json
// Request
{
  "email": "user@example.com",
  "password": "123456",
  "name": "用户名"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "admin" }
}
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "123456" }

// Response
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "admin" }
}
```

### GET /auth/me
获取当前用户信息。需要 Auth。

---

## 2. API Keys (密钥管理)

需要 JWT 认证（不支持 API Key 调用自身）。

### POST /api/api-keys — 生成新密钥
```json
// Request
{ "name": "OpenClaw 每日任务" }

// Response
{
  "success": true,
  "key": {
    "id": "uuid",
    "name": "OpenClaw 每日任务",
    "key": "cj_a1b2c3d4e5f6...（完整密钥，只显示一次）",
    "keyPrefix": "cj_a1b2",
    "createdAt": "..."
  }
}
```

### GET /api/api-keys — 列出密钥（只显示前缀，不显示完整密钥）

### PUT /api/api-keys/:id/revoke — 吊销密钥（立即失效）

### DELETE /api/api-keys/:id — 删除密钥

---

## 3. Products (商品)

### POST /api/products — 创建/更新商品 (Upsert by ASIN)

如果传入的 `asin` 已存在，自动更新；不存在则创建。**这是 OpenClaw 主要调用的接口。**

```json
// Request
{
  "asin": "B0CM5JQZ4K",
  "title": "Apple AirPods Pro (2nd Generation)",
  "price": "$189.99",
  "description": "Active Noise Cancellation...",
  "bulletPoints": ["Active Noise Cancellation", "Customizable fit"],
  "images": ["https://m.media-amazon.com/images/I/xxx.jpg", "https://m.media-amazon.com/images/I/yyy.jpg"],
  "videos": ["https://video-url.mp4"],
  "details": [
    { "label": "Brand", "value": "Apple", "section": "技术规格" },
    { "label": "Model Name", "value": "AirPods Pro", "section": "技术规格" }
  ],
  "reviews": [
    { "reviewer": "John", "rating": "5.0 out of 5 stars", "title": "Great!", "date": "Reviewed on March 1, 2026", "verified": "Verified Purchase", "content": "Amazing sound quality", "helpful": "12 people found this helpful" }
  ],
  "url": "https://www.amazon.com/dp/B0CM5JQZ4K",
  "affiliateUrl": "https://www.amazon.com/dp/B0CM5JQZ4K?tag=yourtag-20",
  "category": "Electronics",
  "tags": ["earbuds", "wireless", "apple"]
}

// Response
{
  "success": true,
  "product": { "id": "uuid", "asin": "B0CM5JQZ4K", ... }
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| asin | string | 是 | Amazon ASIN，10位字母数字 |
| title | string | 是 | 商品标题 |
| price | string | 否 | 价格，如 "$189.99" |
| description | string | 否 | 商品描述文本 |
| bulletPoints | string[] | 否 | 核心卖点列表 |
| images | string[] | 否 | 图片 URL 数组 |
| videos | string[] | 否 | 视频 URL 数组 |
| details | object[] | 否 | 规格参数 `{ label, value, section }` |
| reviews | object[] | 否 | 评论数据 `{ reviewer, rating, title, date, verified, content, helpful }` |
| url | string | 否 | Amazon 商品链接 |
| affiliateUrl | string | 否 | 带 affiliate tag 的链接 |
| category | string | 否 | 分类 |
| tags | string[] | 否 | 标签 |

### GET /api/products?search=&status=&limit=50&offset=0
获取商品列表。需要 Auth。

### GET /api/products/:id
获取单个商品。需要 Auth。

### PUT /api/products/:id
更新商品。需要 Auth。

### DELETE /api/products/:id
删除商品。需要 Auth。

---

## 3. Collections (推荐合集)

### POST /api/collections — 创建合集
```json
// Request
{
  "title": "2026年最佳无线耳机",
  "slug": "best-wireless-earbuds-2026",
  "description": "精选10款高性价比无线耳机推荐",
  "coverImage": "https://example.com/cover.jpg",
  "seoTitle": "2026 Best Wireless Earbuds",
  "seoDescription": "Top picks for wireless earbuds in 2026",
  "seoKeywords": "earbuds, wireless, bluetooth",
  "status": "draft"
}

// Response
{
  "success": true,
  "collection": { "id": "uuid", "slug": "best-wireless-earbuds-2026", ... }
}
```

### POST /api/collections/:id/products — 添加商品到合集
```json
// Request
{
  "productId": "商品UUID",
  "sortOrder": 1,
  "note": "推荐理由，会显示在公开页面"
}

// Response
{
  "success": true,
  "products": [...]
}
```

### PUT /api/collections/:id — 更新合集（如发布）
```json
// Request
{ "status": "published" }
```

### DELETE /api/collections/:id/products/:productId — 从合集移除商品

### GET /api/collections — 获取合集列表
### GET /api/collections/:id — 获取合集详情（含商品列表）
### DELETE /api/collections/:id — 删除合集

---

## 4. Public (公开，无需 Auth)

### GET /api/public/collections
获取所有已发布的合集列表。

### GET /api/public/collections/:slug
获取合集详情 + 商品列表。

### GET /api/public/products/:asin
通过 ASIN 获取商品信息。

### POST /api/public/click
追踪点击。
```json
{ "productId": "uuid", "collectionId": "uuid", "affiliateUrl": "...", "referrer": "..." }
```

### GET /api/public/settings
获取站点设置。

---

## 5. 典型工作流 (OpenClaw 每日任务)

```
方式 A — JWT（7天过期，需定期重新登录）：
  1. POST /api/auth/login  →  获取 token
  2. 后续请求带 Authorization: Bearer <token>

方式 B — API Key（推荐，不过期）：
  1. 在 Admin 后台「API 密钥」页生成 key
  2. 后续请求带 X-API-Key: cj_xxxxxxxx

每日任务流程：
  1. 采集 Amazon 商品 → POST /api/products（upsert by ASIN）
  2. 创建/更新合集   → POST /api/collections / PUT /api/collections/:id
  3. 添加商品到合集   → POST /api/collections/:id/products
  4. 发布合集         → PUT /api/collections/:id  { "status": "published" }
```
