# 🔧 如何重新加载扩展以应用 Markdown 支持

## 快速步骤

1. **打开扩展管理页面**
   - 在 Chrome 浏览器地址栏输入：`chrome://extensions/`
   - 或者点击菜单 → 更多工具 → 扩展程序

2. **重新加载扩展**
   - 找到"OpenAI 网页助手"扩展
   - 点击右下角的 **🔄 重新加载** 按钮

3. **测试 Markdown 渲染**
   - 打开任意网页
   - 点击扩展图标打开侧边栏
   - 向 AI 提问，查看回复是否以 Markdown 格式显示

## 已下载的本地库文件

```
lib/
├── marked.min.js       (35KB) - Markdown 解析
├── highlight.min.js    (118KB) - 代码高亮
└── github.min.css      (1.3KB) - 代码样式
```

## 检查是否生效

打开浏览器控制台（F12），应该看到：
- ✅ `marked 可用: true`
- ✅ `hljs 可用: true`
- ✅ `Markdown 配置完成`

如果看到这些信息，说明 Markdown 渲染已成功启用！
