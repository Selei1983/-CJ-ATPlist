#!/bin/bash

# =============================================================
# CJ-ATPlist API 示例脚本
# 使用前请修改 BASE_URL 和登录凭据
# =============================================================

BASE_URL="http://localhost:3001/api"
TOKEN=""
API_KEY=""

# ── 认证方式 ──────────────────────────────────────────────
# 方式 1: JWT（适合临时调试，7天过期）
# 方式 2: API Key（适合机器调用，不过期） ← 推荐
#
# 使用 API Key 时，请求头带 X-API-Key: cj_xxxxxxxx
# 无需登录，跳过 login() 即可

# ── 1. 登录 (JWT 方式) ────────────────────────────────────

login() {
  echo ">>> 登录获取 Token (JWT 方式)..."
  RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "123456"
    }')
  echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
  TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

  if [ -z "$TOKEN" ]; then
    echo "登录失败，请检查邮箱密码"
    exit 1
  fi
  echo "Token: ${TOKEN:0:20}..."
}

# ── 2. 使用 API Key 认证 (推荐) ────────────────────────────
# 在 Admin 后台「API 密钥」页生成，然后设置环境变量：
#   export CJ_API_KEY="cj_你生成的完整密钥"
# 或直接修改下面这行：
# API_KEY="cj_替换为你的密钥"

auth_header() {
  if [ -n "$API_KEY" ]; then
    echo "-H 'X-API-Key: $API_KEY'"
  else
    echo "-H 'Authorization: Bearer $TOKEN'"
  fi
}

api_call() {
  local method=$1 path=$2 data=$3
  local args=(-s -X "$method" "$BASE_URL$path" -H "Content-Type: application/json")
  if [ -n "$API_KEY" ]; then
    args+=("-H" "X-API-Key: $API_KEY")
  elif [ -n "$TOKEN" ]; then
    args+=("-H" "Authorization: Bearer $TOKEN")
  fi
  if [ -n "$data" ]; then
    args+=("-d" "$data")
  fi
  curl "${args[@]}"
}

# ── 3. 创建/更新商品 (Upsert by ASIN) ──────────────────────

create_product() {
  echo ""
  echo ">>> 创建商品 (ASIN: B0CM5JQZ4K)..."
  api_call POST "/products" '{
    "asin": "B0CM5JQZ4K",
    "title": "Apple AirPods Pro (2nd Generation) Wireless Earbuds",
    "price": "$189.99",
    "description": "Apple-engineered H2 chip delivers smarter noise cancellation and immersive sound",
    "bulletPoints": [
      "Active Noise Cancellation removes unwanted external noise",
      "Customizable fit with four pairs of silicone ear tips",
      "Up to 6 hours of listening time"
    ],
    "images": [
      "https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71fv8WYPkCL._SL1500_.jpg"
    ],
    "details": [
      { "label": "Brand", "value": "Apple" },
      { "label": "Model Name", "value": "AirPods Pro" },
      { "label": "Color", "value": "White" },
      { "label": "Form Factor", "value": "In-Ear" }
    ],
    "reviews": [
      {
        "reviewer": "John D.",
        "rating": "5.0 out of 5 stars",
        "title": "Best earbuds I have ever owned",
        "date": "Reviewed on March 15, 2026",
        "verified": "Verified Purchase",
        "content": "The noise cancellation is incredible. Battery life is great too.",
        "helpful": "42 people found this helpful"
      }
    ],
    "url": "https://www.amazon.com/dp/B0CM5JQZ4K",
    "affiliateUrl": "https://www.amazon.com/dp/B0CM5JQZ4K?tag=yourtag-20",
    "category": "Electronics",
    "tags": ["earbuds", "wireless", "apple", "noise-cancelling"]
  }' | python3 -m json.tool 2>/dev/null
}

# ── 3. 批量创建商品示例 ────────────────────────────────────

batch_products() {
  echo ""
  echo ">>> 批量创建商品..."

  # 商品 2
  api_call POST "/products" '{
      "asin": "B0D9QHS1ZR",
      "title": "Sony WH-1000XM6 Wireless Noise Cancelling Headphones",
      "price": "$349.99",
      "images": ["https://m.media-amazon.com/images/I/example1.jpg"],
      "url": "https://www.amazon.com/dp/B0D9QHS1ZR",
      "category": "Electronics",
      "tags": ["headphones", "sony", "noise-cancelling"]
    }' | python3 -m json.tool 2>/dev/null

  # 商品 3
  api_call POST "/products" '{
      "asin": "B0BSHF7WHW",
      "title": "Samsung Galaxy Buds3 Pro",
      "price": "$179.99",
      "images": ["https://m.media-amazon.com/images/I/example2.jpg"],
      "url": "https://www.amazon.com/dp/B0BSHF7WHW",
      "category": "Electronics",
      "tags": ["earbuds", "samsung", "wireless"]
    }' | python3 -m json.tool 2>/dev/null
}

# ── 4. 创建合集 ────────────────────────────────────────────

create_collection() {
  echo ""
  echo ">>> 创建推荐合集..."
  RESP=$(api_call POST "/collections" '{
      "title": "2026年最佳无线耳机推荐",
      "slug": "best-wireless-earbuds-2026",
      "description": "精选2026年最值得购买的无线耳机，涵盖各价位段",
      "coverImage": "https://example.com/earbuds-cover.jpg",
      "seoTitle": "2026年最佳无线耳机推荐 | 音质与降噪全面评测",
      "seoDescription": "精选10款高性价比无线耳机，从百元到千元全覆盖",
      "seoKeywords": "无线耳机,蓝牙耳机,降噪耳机,2026推荐",
      "status": "draft"
    }')
  echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
  COLLECTION_ID=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin).get('collection',{}); print(d.get('id',''))" 2>/dev/null)
  echo "Collection ID: $COLLECTION_ID"
}

# ── 5. 添加商品到合集 ──────────────────────────────────────

add_products_to_collection() {
  COLLECTION_ID=${1:-"替换为合集UUID"}
  
  # 先获取商品列表拿到 UUID
  echo ""
  echo ">>> 获取商品列表..."
  PRODUCTS=$(api_call GET "/products?limit=50")
  
  # 添加第一个商品
  PRODUCT_ID=$(echo "$PRODUCTS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('products', []):
    if p.get('asin') == 'B0CM5JQZ4K':
        print(p['id'])
        break
" 2>/dev/null)
  
  if [ -n "$PRODUCT_ID" ] && [ "$COLLECTION_ID" != "替换为合集UUID" ]; then
    echo ""
    echo ">>> 添加 AirPods Pro 到合集..."
    api_call POST "/collections/$COLLECTION_ID/products" "{
        \"productId\": \"$PRODUCT_ID\",
        \"sortOrder\": 1,
        \"note\": \"综合最佳，降噪天花板\"
      }" | python3 -m json.tool 2>/dev/null
  else
    echo "跳过添加商品到合集 (需要合集ID和商品ID)"
  fi
}

# ── 6. 发布合集 ────────────────────────────────────────────

publish_collection() {
  COLLECTION_ID=${1:-"替换为合集UUID"}
  
  if [ "$COLLECTION_ID" = "替换为合集UUID" ]; then
    echo "跳过发布 (需要合集ID)"
    return
  fi
  
  echo ""
  echo ">>> 发布合集..."
  api_call PUT "/collections/$COLLECTION_ID" '{ "status": "published" }' | python3 -m json.tool 2>/dev/null
}

# ── 7. 查看公开页面数据 ────────────────────────────────────

check_public() {
  echo ""
  echo ">>> 查看已发布的合集 (公开API，无需Token)..."
  curl -s "$BASE_URL/public/collections" | python3 -m json.tool 2>/dev/null
}

# ── 主流程 ──────────────────────────────────────────────────

echo "========================================="
echo "  CJ-ATPlist API Demo Script"
echo "========================================="

login
create_product
batch_products
create_collection
# 取消下面注释并填入合集ID来测试完整流程：
# add_products_to_collection "合集UUID"
# publish_collection "合集UUID"
check_public

echo ""
echo "========================================="
echo "  Done!"
echo "========================================="
