# OpenAI 网页助手

一个基于 Chrome 浏览器的扩展程序，集成 OpenAI 兼容 API，让你能够与当前浏览的网页内容进行智能对话。

## ✨ 功能特性

- 🤖 **多模型支持**：支持 GPT-4、GPT-4o、GPT-3.5 Turbo 等多个 AI 模型
- 🔌 **API 兼容性**：支持任何 OpenAI 兼容的 API（OpenAI、Azure OpenAI、本地部署等）
- 📖 **智能网页分析**：自动读取和理解当前网页内容
- 💬 **对话式交互**：以自然语言向 AI 提问关于网页的任何问题
- 🔄 **实时刷新**：可随时重新加载网页内容
- 💾 **安全存储**：API Key 和配置安全存储在浏览器本地
- ⚙️ **灵活配置**：支持自定义 API Endpoint
- 🎨 **现代化界面**：简洁美观的用户界面
- 📱 **侧边栏支持**：支持在浏览器侧边栏中使用，提供更好的多任务体验

## 📦 安装步骤

### 1. 准备图标文件

由于 Chrome 扩展需要 PNG 格式的图标，你需要将 SVG 图标转换为 PNG：

```bash
# 可以使用在线工具或命令行工具转换
# 例如使用 ImageMagick:
convert icons/icon16.svg icons/icon16.png
convert icons/icon48.svg icons/icon48.png
convert icons/icon128.svg icons/icon128.png
```

或者使用在线工具如：
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

### 2. 加载扩展到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 在右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的文件夹 `chrome_ai_extension`

## 🔧 配置说明

### 获取 API Key

本扩展支持多种 OpenAI 兼容的 API 服务：

1. **OpenAI API**（推荐）：
   - 访问 https://platform.openai.com/api-keys 获取 API Key
   - API Endpoint: `https://api.openai.com/v1/chat/completions`

2. **Azure OpenAI**：
   - 在 Azure 门户创建 OpenAI 资源
   - API Endpoint: `https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-02-15-preview`

3. **其他兼容服务**：
   - 任何支持 OpenAI chat completions 格式的 API
   - 本地部署的模型（如 LM Studio、Ollama 等）
   - 第三方 API 代理服务

### 配置步骤

1. 点击浏览器工具栏中的扩展图标
2. 在"API Key"输入框中输入你的 API Key
3. 在"API Endpoint"输入框中输入 API 地址（默认为 OpenAI 官方地址）
4. 点击对应的"保存"按钮
5. 选择你想使用的模型（如 GPT-4、GPT-4o 等）

### 支持的模型

扩展内置以下模型选项：
- `gpt-4` - GPT-4
- `gpt-4o` - GPT-4o（最新）
- `gpt-4o-mini` - GPT-4o Mini（性价比高）
- `gpt-4-turbo-preview` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo（速度快）

**注意**：实际可用的模型取决于你使用的 API 服务和账户权限。

## 📖 使用方法

### 方式一：弹出窗口模式

1. **打开扩展**：访问任意网页后，点击浏览器工具栏中的扩展图标
2. **自动加载内容**：扩展会自动读取当前网页的标题、URL 和主要文本内容
3. **开始对话**：在输入框中输入你的问题，例如：
   - "这篇文章的主要观点是什么？"
   - "总结一下这个页面的内容"
   - "帮我解释一下这个概念"
4. **查看回复**：AI 会基于网页内容给出智能回复
5. **继续对话**：可以继续提问，AI 会记住对话上下文

### 方式二：侧边栏模式（推荐）

1. **打开侧边栏**：
   - 方式 1: 右键点击扩展图标，选择"在侧边栏中打开"
   - 方式 2: 在 Chrome 设置中将扩展设置为默认在侧边栏打开
2. **并行浏览**：侧边栏会固定在浏览器右侧，可以一边浏览网页，一边与 AI 对话
3. **切换标签**：切换到不同的标签页时，点击"刷新"按钮即可加载新页面的内容
4. **更多空间**：侧边栏提供更大的显示区域，对话体验更好

**侧边栏优势**：
- 📌 保持打开状态，无需反复点击图标
- 🔄 轻松在多个网页间切换分析
- 📺 更大的对话显示空间
- ⚡ 更流畅的多任务体验

## 🎯 使用示例

### 场景 1：阅读技术文档
```
用户：这个 API 有哪些主要的参数？
AI：根据页面内容，这个 API 主要有以下参数...
```

### 场景 2：阅读新闻文章
```
用户：用三句话总结这篇新闻
AI：1. ... 2. ... 3. ...
```

### 场景 3：学习教程
```
用户：这个教程的第一步是什么？
AI：根据教程内容，第一步是...
```

## 📁 项目结构

```
chrome_ai_extension/
├── manifest.json          # 扩展配置文件
├── popup.html            # 弹出窗口 HTML
├── popup.css             # 弹出窗口样式
├── popup.js              # 弹出窗口逻辑
├── sidepanel.html        # 侧边栏 HTML
├── sidepanel.css         # 侧边栏样式
├── sidepanel.js          # 侧边栏逻辑
├── content.js            # 内容脚本（提取网页内容）
├── background.js         # 后台服务（API 调用）
├── icons/                # 图标文件夹
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 说明文档
```

## 🔐 隐私说明

- API Key 存储在浏览器本地，不会上传到任何服务器
- 网页内容仅在你主动提问时发送给 AI API
- 不会收集或存储你的浏览历史

## 🛠️ 开发说明

### 自定义 API 配置

扩展支持任何 OpenAI 兼容的 API。只需在界面中配置正确的 API Endpoint 和 API Key 即可。

API 请求格式遵循 OpenAI 标准：

```javascript
{
  "messages": [...],
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": false
}
```

### 文件说明

- `background.js` - 后台服务，处理 API 调用
- `popup.js` / `popup.html` / `popup.css` - 弹出窗口界面和逻辑
- `sidepanel.js` / `sidepanel.html` / `sidepanel.css` - 侧边栏界面和逻辑
- `content.js` - 内容脚本，提取网页内容
- `manifest.json` - 扩展配置文件

### 调试

1. 在 `chrome://extensions/` 页面找到扩展
2. 点击"背景页"或"service worker"查看后台日志
3. 在扩展弹窗中右键选择"检查"查看前端日志

## ⚠️ 常见问题

**Q: 如何使用侧边栏模式？**
A: 右键点击扩展图标，选择"在侧边栏中打开"，或在 Chrome 扩展设置中将其设为默认在侧边栏打开。

**Q: 侧边栏和弹出窗口有什么区别？**
A: 侧边栏模式提供更大的空间和更持久的显示，适合长时间使用；弹出窗口更轻量，适合快速查询。

**Q: API 调用失败怎么办？**
A: 检查 API Key 是否正确，确认网络连接正常，查看浏览器控制台的错误信息。

**Q: 网页内容加载失败？**
A: 尝试刷新网页后重新打开扩展，某些特殊页面（如 chrome:// 开头的页面）无法读取内容。

**Q: 支持哪些 API 服务？**
A: 支持任何 OpenAI 兼容的 API，包括 OpenAI 官方、Azure OpenAI、本地部署的模型等。

**Q: 支持哪些模型？**
A: 默认支持 GPT-4、GPT-4o、GPT-4o Mini、GPT-4 Turbo、GPT-3.5 Turbo。实际可用模型取决于你的 API 服务。

**Q: 如何使用本地部署的模型？**
A: 将 API Endpoint 设置为你本地模型的地址，如 `http://localhost:1234/v1/chat/completions`（LM Studio）。

**Q: 能否离线使用？**
A: 不能，需要网络连接来调用 AI API。

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**注意**：使用本扩展需要有效的 AI API Key，API 调用可能产生费用，请注意使用量。
