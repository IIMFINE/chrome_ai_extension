# OpenAI 网页助手 - 安装指南

## 快速开始

### 1. 生成图标文件

运行脚本自动生成 PNG 图标：

```bash
chmod +x generate_icons.sh
./generate_icons.sh
```

如果脚本执行失败，可以：

**选项 A：安装转换工具**
```bash
# Ubuntu/Debian
sudo apt-get install librsvg2-bin

# macOS
brew install librsvg

# 或者安装 ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS
```

**选项 B：使用在线工具**
访问以下网站手动转换 SVG 到 PNG：
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)

需要转换的文件：
- `icons/icon16.svg` → `icons/icon16.png` (16x16)
- `icons/icon48.svg` → `icons/icon48.png` (48x48)
- `icons/icon128.svg` → `icons/icon128.png` (128x128)

### 2. 配置 API

本扩展支持任何 OpenAI 兼容的 API。不需要修改代码，只需在界面中配置：

#### 使用 OpenAI API（推荐）

1. 访问 https://platform.openai.com/api-keys 获取 API Key
2. 在扩展界面中：
   - API Key: 输入你的 OpenAI API Key
   - API Endpoint: `https://api.openai.com/v1/chat/completions`（默认值）
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: messages,
      model: model,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}
```

#### 获取 OpenAI API Key

1. 访问 [OpenAI API Keys](https://platform.openai.com/api-keys)
2. 登录或注册账号
3. 点击"Create new secret key"创建新的 API Key
4. 复制并保存好你的 API Key

### 3. 安装扩展到 Chrome

1. 打开 Chrome 浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 在页面右上角启用"开发者模式"开关
4. 点击左上角的"加载已解压的扩展程序"按钮
5. 选择 `chrome_ai_extension` 文件夹
6. 确认扩展已成功加载

### 4. 配置扩展

1. 点击浏览器工具栏中的扩展图标（紫色渐变机器人图标）
2. 在弹出窗口中输入你的 OpenAI API Key
3. 点击"保存"按钮
4. 选择你想使用的模型（推荐 GPT-4 或 GPT-3.5 Turbo）

### 5. 开始使用

1. 访问任意网页（例如一篇文章、技术文档等）
2. 点击扩展图标打开对话窗口
3. 扩展会自动读取网页内容
4. 在输入框中输入问题，例如：
   - "总结这篇文章的主要内容"
   - "解释一下这个概念"
   - "这个页面讲的是什么？"
5. 按回车或点击"发送"按钮
6. 等待 AI 回复

## 支持的模型

使用 OpenAI API 时，可选择以下模型：

- **GPT-4** - 最强大，回答质量最高（推荐）
- **GPT-4 Turbo** - 速度更快，性价比高
- **GPT-3.5 Turbo** - 速度最快，成本最低

## 费用说明

使用 OpenAI API 会产生费用，按使用量计费：

- GPT-4: 约 $0.03/1K tokens (输入) + $0.06/1K tokens (输出)
- GPT-3.5 Turbo: 约 $0.0005/1K tokens (输入) + $0.0015/1K tokens (输出)

建议在 OpenAI 账户中设置使用限额以控制费用。

## 故障排除

### 问题：无法读取网页内容

**解决方案：**
- 刷新网页后重新打开扩展
- 某些特殊页面（如 `chrome://` 开头的页面）无法读取
- 确保已授予扩展必要的权限

### 问题：API 调用失败

**解决方案：**
- 检查 API Key 是否正确设置
- 确认网络连接正常
- 检查 OpenAI 账户余额是否充足
- 打开浏览器开发者工具查看具体错误信息

### 问题：扩展图标不显示

**解决方案：**
- 确保已生成 PNG 格式的图标文件
- 重新加载扩展
- 检查 `icons` 文件夹中是否有 `.png` 文件

## 高级配置

### 使用其他 AI 服务

如果你想使用其他 AI API（如 Azure OpenAI、Anthropic Claude 等），可以修改 `background.js` 中的 API 端点和请求格式。

### 调整上下文长度

在 `content.js` 中修改 `maxLength` 变量来控制发送给 AI 的网页内容长度：

```javascript
const maxLength = 10000; // 调整这个值
```

### 自定义系统提示词

在 `popup.js` 的 `buildMessages` 函数中修改 `systemMessage` 来自定义 AI 的行为。

## 更新日志

### v1.0.0 (2025-10-07)
- 初始版本发布
- 支持多种 AI 模型
- 自动网页内容提取
- 对话式交互界面

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
