# 迁移说明 - 从 GitHub Copilot 到 OpenAI 兼容 API

## 📋 修改概述

本次更新将扩展从使用 GitHub Copilot API 改为支持 OpenAI 兼容的 API，增加了更大的灵活性。

## ✅ 已完成的修改

### 1. 核心代码文件

#### `background.js`
- ✅ 将 `callCopilotAPI` 函数重命名为 `callOpenAIAPI`
- ✅ 移除 GitHub Copilot 特有的请求头（Editor-Version、Editor-Plugin-Version 等）
- ✅ 添加 `apiEndpoint` 参数支持，支持自定义 API 地址
- ✅ 更新默认配置，添加 `apiEndpoint` 初始化
- ✅ 将 API 调用消息名称从 `callCopilotAPI` 改为 `callOpenAIAPI`

#### `popup.js`
- ✅ 添加 `apiEndpoint` 变量和相关 DOM 元素引用
- ✅ 在 `loadSettings()` 中添加 `apiEndpoint` 加载逻辑
- ✅ 添加保存 API Endpoint 的功能和事件监听器
- ✅ 更新 `callAPI()` 函数，传递 `apiEndpoint` 参数
- ✅ 将消息 action 从 `callCopilotAPI` 改为 `callOpenAIAPI`

#### `popup.html`
- ✅ 更新页面标题为 "OpenAI 网页助手"
- ✅ 更新标题为 "AI 助手"
- ✅ 更新 API Key 输入框提示文本
- ✅ 添加 API Endpoint 配置输入框和保存按钮
- ✅ 简化模型选择下拉框的描述文本

#### `content.js`
- ✅ 更新控制台日志消息

#### `manifest.json`
- ✅ 更新扩展名称为 "OpenAI 网页助手"
- ✅ 更新描述为 "使用 OpenAI 兼容 API 分析和问答当前网页内容"
- ✅ 更新 `host_permissions` 为 OpenAI API 域名

#### `config.example.json`
- ✅ 确认配置符合 OpenAI API 标准
- ✅ 添加使用说明注释

### 2. 文档文件

#### `README.md`
- ✅ 更新标题和描述
- ✅ 添加 API 兼容性说明
- ✅ 更新配置说明，介绍多种 API 服务
- ✅ 添加自定义 API Endpoint 的配置步骤
- ✅ 更新常见问题解答

#### `INSTALL.md`
- ✅ 更新标题
- ✅ 简化配置说明，强调界面配置而非代码修改

#### `QUICKSTART.md`
- ✅ 简化步骤，移除需要修改代码的部分
- ✅ 添加界面配置说明

#### `PROJECT_SUMMARY.md`
- ✅ 更新项目名称

#### `STRUCTURE.txt`
- ✅ 更新外部依赖说明

## 🎯 主要改进

### 1. 更灵活的 API 支持
- 支持任何 OpenAI 兼容的 API
- 可通过界面配置 API Endpoint，无需修改代码
- 支持以下服务：
  - OpenAI 官方 API
  - Azure OpenAI
  - 本地部署的模型（LM Studio、Ollama 等）
  - 其他第三方 API 代理服务

### 2. 简化的配置流程
- 用户无需修改代码
- 所有配置通过界面完成
- 提供清晰的默认值

### 3. 更好的用户体验
- 添加 API Endpoint 配置输入框
- 保留所有原有功能
- 界面更加清晰友好

## 🔧 使用方法

### 基本配置

1. 在扩展界面中配置：
   - **API Key**: 你的 API 密钥
   - **API Endpoint**: API 地址（默认：`https://api.openai.com/v1/chat/completions`）
   - **模型**: 选择要使用的模型

2. 点击对应的"保存"按钮

### 使用 OpenAI 官方 API

```
API Key: sk-your-openai-api-key
API Endpoint: https://api.openai.com/v1/chat/completions
模型: gpt-4o 或 gpt-4
```

### 使用 Azure OpenAI

```
API Key: your-azure-api-key
API Endpoint: https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-02-15-preview
模型: 你的部署模型名称
```

### 使用本地模型（如 LM Studio）

```
API Key: not-needed（可以填写任意值）
API Endpoint: http://localhost:1234/v1/chat/completions
模型: 本地模型名称
```

## 📝 API 请求格式

扩展发送的请求遵循 OpenAI 标准格式：

```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": false
}
```

请求头：

```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

## ⚠️ 注意事项

1. **API Key 安全**: API Key 存储在浏览器本地，不会上传到服务器
2. **费用控制**: 使用 API 可能产生费用，请注意使用量
3. **模型可用性**: 实际可用的模型取决于你的 API 服务和账户权限
4. **CORS 限制**: 某些本地部署的服务可能需要配置 CORS 才能正常使用

## 🔄 兼容性

- ✅ 完全向后兼容（已有配置会自动添加默认 endpoint）
- ✅ 支持所有原有功能
- ✅ 无需重新配置（除非要更改 API endpoint）

## 📞 支持

如有问题，请查看：
- README.md - 完整使用说明
- INSTALL.md - 安装指南
- GitHub Issues - 报告问题和建议

---

更新日期: 2025-10-07
版本: 1.0.0
