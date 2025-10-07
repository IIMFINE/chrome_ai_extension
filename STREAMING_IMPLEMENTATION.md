# 流式回复实现文档

## 概述

本文档说明如何为 Chrome AI 扩展实现流式回复功能，以解决大模型回复被截断的问题。

## 更新内容

### 1. background.js 修改

#### 新增流式 API 函数
- 添加 `callOpenAIAPIStream()` 函数支持 Server-Sent Events (SSE) 流式响应
- 增加 `max_tokens` 从 2000 提升到 4000，避免长回复被截断
- 实现流式数据解析和分发机制

#### 关键特性
```javascript
// 启用流式响应
stream: true

// 解析 SSE 数据流
const reader = response.body.getReader();
const decoder = new TextDecoder('utf-8');

// 逐块发送数据到前端
chrome.runtime.sendMessage({
  action: 'streamChunk',
  content: content,
  tabId: tabId
});
```

#### 消息类型
- `streamChunk` - 流式数据块
- `streamComplete` - 流式传输完成
- `streamError` - 流式传输错误

### 2. sidepanel.js 修改

#### 新增全局变量
```javascript
let currentStreamingMessageId = null; // 当前流式消息 ID
let currentStreamingContent = ''; // 累积的流式内容
```

#### 新增函数
- `setupStreamListener()` - 设置流式消息监听器
- `handleStreamChunk()` - 处理流式数据块
- `handleStreamComplete()` - 处理流式完成
- `handleStreamError()` - 处理流式错误
- `updateStreamingMessage()` - 实时更新消息显示
- `finalizeStreamingMessage()` - 完成后应用 Markdown 渲染
- `callStreamAPI()` - 调用流式 API

#### 工作流程
1. 用户发送消息
2. 创建空的助手消息占位符
3. 调用流式 API
4. 接收数据块并实时更新显示（纯文本）
5. 流式完成后应用 Markdown 渲染和代码高亮
6. 更新聊天历史

### 3. popup.js 修改

与 sidepanel.js 类似的修改，但不包含 Markdown 渲染（popup 使用纯文本显示）。

## 技术细节

### Server-Sent Events (SSE) 格式
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

### 数据流处理
1. 使用 `ReadableStream` 读取响应体
2. `TextDecoder` 解码 UTF-8 数据
3. 按行分割处理 SSE 格式
4. 提取 `delta.content` 并累积
5. 通过 `chrome.runtime.sendMessage` 发送到前端

### Markdown 渲染策略
- **流式过程中**：显示纯文本，提供即时反馈
- **完成后**：应用 marked.js 和 highlight.js 渲染

这种方式确保：
- 用户看到实时的打字效果
- 避免频繁的 Markdown 解析影响性能
- 最终呈现完整格式化的内容

## 优势

### 1. 解决截断问题
- 增加 `max_tokens` 到 4000
- 流式传输无需等待完整响应
- 支持更长的 AI 回复

### 2. 改善用户体验
- 实时显示 AI 回复（打字效果）
- 提供即时反馈
- 减少等待焦虑

### 3. 更好的性能
- 减少首字节时间 (TTFB)
- 渐进式内容展示
- 避免一次性大量数据传输

### 4. 错误处理
- 流式错误能及时反馈
- 不会因超时丢失部分回复
- 提供更细粒度的错误信息

## 兼容性

### 支持的 API
- OpenAI API (GPT-4, GPT-3.5-turbo 等)
- OpenAI 兼容 API（需支持 `stream: true` 参数）

### 浏览器要求
- Chrome 88+ (支持 Manifest V3)
- 支持 ReadableStream API
- 支持 chrome.runtime.sendMessage

## 使用说明

流式回复功能已自动启用，无需任何配置。

### 测试方法
1. 设置 API Key 和 Endpoint
2. 选择支持流式的模型
3. 发送较长的问题（如"详细解释这个页面的内容"）
4. 观察回复逐字显示的效果

### 兼容模式
如果 API 不支持流式传输，扩展会自动报错。可以通过以下方式回退：
1. 修改 `sendMessage()` 函数
2. 将 `callStreamAPI()` 改回 `callAPI()`
3. 这将使用非流式模式（但可能仍有截断问题）

## 故障排查

### 问题：没有看到流式效果
- 检查 API 是否支持 `stream: true` 参数
- 查看浏览器控制台是否有错误
- 确认 Endpoint 正确

### 问题：回复仍被截断
- 检查 API 提供商的 token 限制
- 可以在 background.js 中继续增加 `max_tokens`
- 考虑使用支持更长上下文的模型

### 问题：Markdown 渲染不正确
- 确保 marked.js 和 highlight.js 已正确加载
- 检查 sidepanel.html 中的 script 标签
- 查看控制台中的渲染错误

## 未来改进

- [ ] 添加流式/非流式切换选项
- [ ] 支持停止生成功能
- [ ] 优化流式过程中的 Markdown 部分渲染
- [ ] 添加重试机制
- [ ] 支持流式速率限制

## 参考资料

- [OpenAI Streaming API](https://platform.openai.com/docs/api-reference/streaming)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
