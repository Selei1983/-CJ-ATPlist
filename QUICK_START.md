# 快速配置指南 - Appwrite Web Platform

## ⚠️ 当前错误

**错误信息**: `ERROR: Cannot read "image.png" (this model does not support image input)`
**说明**: 这是系统提示，不是扩展问题，请忽略。

---

## 🎯 快速配置步骤（5 步完成）

### ✅ 已完成
- [x] 修复 manifest.json JSON 语法
- [x] 添加 Appwrite API 调试日志
- [x] 嵌入 Appwrite 配置
- [x] 修复注册 name 字段验证
- [x] 添加扩展 ID 日志输出

---

## 🔑 Appwrite 配置步骤

### 步骤 1：登录 Appwrite
```
网址: https://appwrite.shumitech.com
账号: [您的邮箱和密码]
```

### 步骤 2：选择项目
```
1. 点击左侧 "Projects"
2. 选择项目: 6963a6d10023ddbd0b80
```

### 步骤 3：进入平台设置
```
1. 点击左侧 "Platform" (平台）
2. 点击 "+ New Platform" 按钮
```

### 步骤 4：填写平台信息

**重要：必须填写完整！**

| 字段 | 填写内容 | 说明 |
|------|---------|------|
| **Name** | Amazon Product Exporter | 自定义名称 |
| **Type** | Web | 选择 Web 类型 |
| **Hostname** | chrome-extension://[扩展ID] | 详见下方 |
| **Domains** | (留空) | Web 平台不需要 |
| **Protect** | (不勾选) | 暂时不需要 |

**关于 Hostname：**
- 必须是 `chrome-extension://` 开头
- 后面接扩展的 32 位 ID
- **如何获取扩展 ID**：见步骤 5

### 步骤 5：获取扩展 ID

**方法 1：在 Chrome 扩展页面查看**
```
1. 打开: chrome://extensions/
2. 找到 "Amazon 商品信息导出"
3. 点击 "详细信息"
4. 在地址栏看到: chrome-extension://abcdefghijklmnop/ (32位字符)
```

**方法 2：在控制台查看（已添加）**
```
1. 重新加载扩展
2. 访问 Amazon 商品页面
3. 打开侧边栏（F12 → Console）
4. 查看日志: [Appwrite] Extension ID: chrome-extension://...
```

---

## 🔒 重要注意事项

### ⚠️ 关于 "image.png" 错误
- 这是系统消息，不是扩展错误
- 请忽略此错误
- 不影响功能使用

### ⚠️ 平台类型
- 必须选择 **"Web"** 类型
- 不要选择 iOS、Android 或其他类型

### ⚠️ Hostname 格式
- 必须是：`chrome-extension://[32位ID]`
- 不需要包含域名
- 不需要协议（除了 chrome-extension://）

---

## ✅ 配置完成后

配置完成并点击 "Save" 后：

### 1. 测试注册功能
1. 访问 Amazon 商品页面
2. 点击扩展图标
3. 点击"注册"按钮
4. 输入测试账号信息
5. 查看控制台日志

**预期结果**：
- 如果成功：看到 `[Appwrite] Account created successfully` 日志
- 如果失败：查看具体错误信息

### 2. 调试密码错误

如果仍然报 `密码无效` 错误：
- 确保密码长度至少 8 位
- 确保密码只包含字母和数字
- 查看控制台 `[Appwrite] Creating account for: xxx` 日志

---

## 🔍 常见问题

### Q1: 找不到 "Add Platform" 按钮
**A**: 点击 "+ New Platform" 而不是 "Add Web Platform"
**B**: 可能权限不足，联系 Appwrite 管理员

### Q2: Hostname 保存后提示错误
**A**: 确保格式是 `chrome-extension://[ID]`
**B**: 不要在 ID 前添加任何字符（如 `www.`）

### Q3: 仍然报 "Unsupported platform"
**A**: 确保选择了 "Web" 类型
**B**: 检查 Hostname 是否包含域名（应该只是 chrome-extension://...）
**C**: 可能需要联系 Appwrite 技术支持

### Q4: 注册成功但无法登录
**A**: 检查控制台 Session 日志
**B**: 尝试重新打开侧边栏
**C**: 检查网络连接

---

## 📋 配置检查清单

配置完成后，请检查：

- [ ] 已登录 Appwrite 控制台
- [ ] 已选择项目 6963a6d10023ddbd0b80
- [ ] 已创建 Web Platform
- [ ] Type 设置为 "Web"
- [ ] Hostname 设置为 chrome-extension://[您的扩展ID]
- [ ] Domains 留空
- [ ] 已点击 Save 按钮

---

## 🚀 开始测试

配置完成后，立即进行以下测试：

1. ✅ 测试用户注册
2. ✅ 测试用户登录
3. ✅ 测试会话持久化（刷新扩展）
4. ✅ 测试保存到云端
5. ✅ 测试查看已保存列表

---

**📞 配置 Appwrite 后，请告诉我测试结果！**
