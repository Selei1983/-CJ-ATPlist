# Amazon 商品信息导出 Chrome 扩展

## 功能特性

### v2.0 新增功能
- 🔐 用户注册和登录（基于 Appwrite）
- ☁️ Markdown 云端存储（支持多设备同步）
- 📚 已保存文档管理（查看、下载、删除）
- 🔍 文档搜索功能（按标题或 ASIN）
- 🔄 自动会话管理（记住登录状态）
- 💾 基于_ASIN_ 的文档命名

### v1.0 功能
- 📦 自动识别 Amazon 商品列表页和详情页
- 🖼️ 提取所有商品图片（主图、缩略图、变体图）
- 🎥 提取商品视频链接
- 📝 提取结构化商品信息（技术规格、产品详情等）
- ⭐ 提取详细买家评论（评分、验证状态、内容等）
- 📄 导出为 Markdown 格式文件
- 🎨 现代化界面设计

## 安装方法

### 方式一：开发者模式安装（推荐）

1. 克隆或下载项目代码
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

### 方式二：从源代码安装

1. 访问 `chrome://extensions/`
2. 开启"开发者模式"
3. 将项目文件夹拖拽到扩展页面
4. 确认安装

## 使用方法

### 1. 获取商品信息
1. 访问 Amazon 商品页面（列表页或详情页）
2. 点击浏览器工具栏中的扩展图标
3. 侧边栏将自动显示提取的商品信息
4. 支持刷新数据重新获取

### 2. 本地下载
1. 点击"下载 Markdown"按钮
2. 文件将下载到本地
3. 文件名：`商品信息_YYYY-MM-DD_HH-mm-ss.md`

### 3. 云端存储（需要登录）
1. 首次使用：点击"注册"，填写信息创建账号
2. 后续使用：点击"登录"，使用邮箱密码登录
3. 点击"保存到云端"按钮保存当前文档
4. 文档将自动关联商品的 ASIN
5. 同一 ASIN 多次保存会更新旧文档

### 4. 管理已保存文档
1. 查看已保存文档列表
2. 支持搜索（标题或 ASIN）
3. 点击"下载"获取云端文档
4. 点击"删除"移除文档

## 云端存储说明

### 后端服务
- 服务提供商：Appwrite
- Endpoint: https://appwrite.shumitech.com/v1
- 功能：用户认证 + 数据库存储

### 数据安全
- ✅ 用户密码加密存储
- ✅ 每个用户只能访问自己的数据
- ✅ HTTPS 通信加密
- ✅ 会话管理（自动登录）

### 文档命名规则
- 格式：`[ASIN].md`
- 示例：`B08XYZ123.md`
- 同一ASIN多次保存：自动更新旧版本

## 版本信息

- **当前版本**: 2.0
- **Manifest Version**: 3
- **支持平台**: Amazon.com

## 更新日志

### v2.0 (2025-01-11)
- ✨ 新增用户注册和登录功能
- ✨ 新增 Markdown 云端存储
- ✨ 新增已保存文档管理
- ✨ 新增文档搜索功能
- 🔒 集成 Appwrite 后端服务
- 🎨 重构UI，优化用户体验
- 🐛 修复通信架构和错误处理

### v1.0 (2025-01-10)
- 🎉 初始版本发布
- ✨ 支持商品列表页和详情页数据提取
- ✨ 支持图片、视频、评论、商品信息提取
- ✨ Markdown 格式导出
- ✨ 自定义图标设计

## 技术栈

- **前端**: Vanilla JavaScript + Chrome Extension API (Manifest V3)
- **后端**: Appwrite (开源 BaaS 平台)
- **样式**: CSS3
- **通信**: REST API + Chrome Extension Messaging

## 权限说明

- `scripting` - 用于注入内容脚本
- `activeTab` - 用于访问当前标签页
- `sidePanel` - 用于显示侧边栏
- `storage` - 用于存储提取的数据和会话
- `https://www.amazon.com/*` - Amazon 网站访问权限
- `https://appwrite.shumitech.com/*` - Appwrite 服务访问权限

## 配置说明

### Appwrite 配置
配置文件：`config/appwrite.json`

```json
{
  "endpoint": "https://appwrite.shumitech.com/v1",
  "projectId": "6963a6d10023ddbd0b80",
  "apiKey": "[API Key]",
  "databaseId": "default",
  "collectionId": "markdowns"
}
```

⚠️ **注意**: 生产环境部署时请替换 API Key

## 开发说明

### 项目结构
```
CJ-ATPlist/
├── manifest.json          # 扩展配置
├── background.js         # 后台服务
├── sidebar.html          # 侧边栏界面
├── sidebar.js           # 侧边栏逻辑
├── sidebar.css          # 样式文件
├── scripts/
│   ├── content.js       # 内容脚本（数据提取）
│   └── appwrite.js     # Appwrite SDK 封装
├── config/
│   └── appwrite.json    # Appwrite 配置
├── assets/
│   └── icons/          # 图标资源
├── DESIGN_v2.0.md      # v2.0 设计文档
└── README.md             # 项目说明
```

### 修改 API Key
1. 编辑 `config/appwrite.json`
2. 替换 `apiKey` 字段
3. 重新加载扩展

## 故障排除

### 无法登录
- 检查网络连接
- 确认邮箱和密码正确
- 尝试退出后重新登录

### 无法保存到云端
- 确认已登录
- 检查 ASIN 是否有效
- 查看浏览器控制台错误信息

### 扩展无法加载
- 确认所有文件路径正确
- 检查 manifest.json 语法
- 查看扩展错误页面

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- 项目地址: http://git.zjpb.net/jowelin/atplist
- 问题反馈: 请在项目中提交 Issue
