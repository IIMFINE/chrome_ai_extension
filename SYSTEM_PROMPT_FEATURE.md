# System Prompt 功能说明

## 功能概述
新增了 System Prompt（系统提示词）设置功能，允许用户自定义与 AI 对话时的系统提示，默认值为："返回markdown的格式化中，格式统一为plain txt"。

## 实现细节

### 1. 变量定义
在 `sidepanel.js` 中添加了：
- `systemPrompt` 变量，默认值为 `'返回markdown的格式化中，格式统一为plain txt'`
- `systemPromptInput` DOM 元素引用（textarea 输入框）
- `saveSystemPromptBtn` DOM 元素引用（保存按钮）

### 2. UI 界面
在 `sidepanel.html` 的设置区域添加了：
- 一个 textarea 输入框，用于输入和编辑系统提示词
- 一个保存按钮，用于保存用户自定义的系统提示词
- 标签为 "System Prompt:"

### 3. 数据持久化
- **加载**：在 `loadSettings()` 函数中，从 `chrome.storage.sync` 加载已保存的 `systemPrompt`
- **保存**：通过保存按钮的事件监听器，将用户输入的 `systemPrompt` 保存到 `chrome.storage.sync`
- 如果用户未设置，则使用默认值

### 4. 消息构建
在 `buildMessages()` 函数中，系统提示词被添加到系统消息的末尾：
```javascript
${systemPrompt ? '\n用户要求：' + systemPrompt : ''}
```

## 使用方法

1. 点击侧边栏顶部的 ⚙️ 设置按钮
2. 在 "System Prompt:" 输入框中输入自定义的系统提示词
3. 点击"保存"按钮
4. 之后的所有对话都会使用这个系统提示词

## 默认行为
- 首次使用时，系统提示词默认为："返回markdown的格式化中，格式统一为plain txt"
- 这个默认值会在用户对话时自动添加到系统消息中
- 用户可以随时修改此提示词以满足不同需求

## 技术要点
- 使用 Chrome 扩展的 `chrome.storage.sync` API 实现跨设备同步
- 系统提示词会附加到原有的网页内容系统消息之后
- 保存成功后会显示 "✅ System Prompt 已保存" 提示
