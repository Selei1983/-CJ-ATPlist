# Amazon 商品信息导出 Chrome 扩展

## 功能特性

- 📦 自动识别 Amazon 商品列表页和详情页
- 🖼️ 提取所有商品图片（主图、缩略图、变体图）
- 🎥 提取商品视频链接
- 📝 提取结构化商品信息（技术规格、产品详情等）
- ⭐ 提取详细买家评论（评分、验证状态、内容等）
- 📄 导出为 Markdown 格式文件
- 🎨 现代化界面设计

## 安装方法

### 方式一：开发者模式安装（推荐）

1. 下载 `amazon-product-exporter-v1.0.zip` 并解压
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的文件夹

### 方式二：从压缩包安装

1. 下载 `amazon-product-exporter-v1.0.zip`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 将压缩包拖拽到扩展页面
4. 确认安装

## 使用方法

1. 访问 Amazon 商品页面（列表页或详情页）
2. 点击浏览器工具栏中的扩展图标
3. 侧边栏将自动显示提取的商品信息
4. 点击"下载 Markdown"按钮导出数据

## 版本信息

- 版本: 1.0
- Manifest Version: 3
- 支持: Amazon.com

## 技术栈

- Vanilla JavaScript
- Chrome Extension API (Manifest V3)
- CSS3

## 权限说明

- `scripting` - 用于注入内容脚本
- `activeTab` - 用于访问当前标签页
- `sidePanel` - 用于显示侧边栏
- `storage` - 用于存储提取的数据

## 更新日志

### v1.0 (2025-01-10)
- 初始版本发布
- 支持商品列表页和详情页数据提取
- 支持图片、视频、评论、商品信息提取
- Markdown 格式导出
- 自定义图标设计
