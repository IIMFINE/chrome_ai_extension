// Sidepanel.js - 侧边栏交互逻辑
let pageContent = null;
let chatHistory = [];
let apiKey = '';
let selectedModel = 'gpt-4';
let apiEndpoint = 'https://api.openai.com/v1/chat/completions';
let sendMethod = 'enter'; // 'enter' or 'ctrl-enter'
let systemPrompt = '使用 Markdown 格式，代码块的格式使用 plain txt，避免将整个回复用三个反引号包裹起来'; // 默认 system prompt
let currentStreamingMessageId = null; // 当前正在流式接收的消息 ID
let currentStreamingContent = ''; // 当前流式接收的内容
let activeMessageEditor = null; // 当前激活的消息编辑器

// DOM 元素
const settingsToggleBtn = document.getElementById('settingsToggle');
const settingsSection = document.querySelector('.settings-section');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiEndpointInput = document.getElementById('apiEndpoint');
const saveEndpointBtn = document.getElementById('saveEndpoint');
const modelInput = document.getElementById('modelInput');
const modelList = document.getElementById('modelList');
const refreshModelsBtn = document.getElementById('refreshModels');
const sendMethodSelect = document.getElementById('sendMethod');
const systemPromptInput = document.getElementById('systemPrompt');
const saveSystemPromptBtn = document.getElementById('saveSystemPrompt');
const pageTitleEl = document.getElementById('pageTitle');
const pageUrlEl = document.getElementById('pageUrl');
const refreshPageBtn = document.getElementById('refreshPage');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusBar = document.getElementById('statusBar');

// 存储所有模型列表用于筛选
let allModels = [];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPageContent();
  await loadModels();
  setupEventListeners();
  setupMarked();
  setupStreamListener();
});

// 设置流式消息监听器
function setupStreamListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'streamChunk') {
      handleStreamChunk(request.content);
      sendResponse({ received: true });
    } else if (request.action === 'streamComplete') {
      handleStreamComplete();
      sendResponse({ received: true });
    } else if (request.action === 'streamError') {
      handleStreamError(request.error);
      sendResponse({ received: true });
    }
    return true;
  });
}

// 处理流式数据块
function handleStreamChunk(content) {
  if (!currentStreamingMessageId) {
    console.error('没有活动的流式消息');
    return;
  }

  console.log('收到流式数据块，当前消息ID:', currentStreamingMessageId);

  // 如果是第一次收到数据，清空"等待回复。。。"提示
  if (currentStreamingContent === '') {
    const messageDiv = document.getElementById(currentStreamingMessageId);
    if (messageDiv) {
      console.log('清空等待提示，消息类型:', messageDiv.className);
      messageDiv.textContent = '';
    } else {
      console.error('找不到消息元素来清空等待提示:', currentStreamingMessageId);
    }
  }

  currentStreamingContent += content;
  
  // 更新消息显示
  updateStreamingMessage(currentStreamingMessageId, currentStreamingContent);
}

// 处理流式完成
function handleStreamComplete() {
  if (!currentStreamingMessageId) {
    console.error('没有活动的流式消息');
    return;
  }

  // 最终渲染 Markdown
  finalizeStreamingMessage(currentStreamingMessageId, currentStreamingContent);
  
  // 更新聊天历史
  const assistantHistoryIndex = chatHistory.push({ role: 'assistant', content: currentStreamingContent }) - 1;
  const assistantMessageElement = document.getElementById(currentStreamingMessageId);
  if (assistantMessageElement) {
    assistantMessageElement.dataset.historyIndex = assistantHistoryIndex;
    assistantMessageElement.dataset.originalContent = currentStreamingContent;
  }
  
  // 重置流式状态
  currentStreamingMessageId = null;
  currentStreamingContent = '';
  
  // 启用输入
  setInputEnabled(true);
  userInput.focus();
  updateStatus('');
}

// 处理流式错误
function handleStreamError(error) {
  if (currentStreamingMessageId) {
    removeMessage(currentStreamingMessageId);
  }
  
  addMessage('error', '流式响应错误: ' + error);
  
  // 重置流式状态
  currentStreamingMessageId = null;
  currentStreamingContent = '';
  
  // 清除状态栏
  updateStatus('');
  
  // 启用输入
  setInputEnabled(true);
  userInput.focus();
}

// 更新流式消息
function updateStreamingMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (!messageDiv) {
    console.error('找不到消息元素:', messageId);
    return;
  }
  
  // 验证这是一个助手消息元素
  if (!messageDiv.classList.contains('assistant-message')) {
    console.error('警告：试图更新非助手消息:', messageId, messageDiv.className);
    return;
  }
  
  // 直接显示文本内容（在流式过程中）
  messageDiv.textContent = content;
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 最终化流式消息（应用 Markdown 渲染）
function finalizeStreamingMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (!messageDiv) {
    console.error('找不到要最终化的消息元素:', messageId);
    return;
  }
  
  // 验证这是一个助手消息元素
  if (!messageDiv.classList.contains('assistant-message')) {
    console.error('警告：试图最终化非助手消息:', messageId, messageDiv.className);
    return;
  }
  
  // 应用 Markdown 渲染
  if (typeof marked !== 'undefined') {
    try {
      const html = marked.parse(content);
      messageDiv.innerHTML = html;
      
      // 应用代码高亮
      if (typeof hljs !== 'undefined') {
        messageDiv.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    } catch (e) {
      console.error('Markdown 解析失败:', e);
      messageDiv.textContent = content;
    }
  } else {
    messageDiv.textContent = content;
  }
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 配置 marked.js 和代码高亮
function setupMarked() {
  console.log('设置 Markdown 渲染...');
  console.log('marked 可用:', typeof marked !== 'undefined');
  console.log('hljs 可用:', typeof hljs !== 'undefined');
  
  if (typeof marked !== 'undefined') {
    // 配置 marked
    marked.setOptions({
      highlight: function(code, lang) {
        if (typeof hljs !== 'undefined') {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (e) {
              console.error('代码高亮失败:', e);
            }
          } else {
            // 自动检测语言
            try {
              return hljs.highlightAuto(code).value;
            } catch (e) {
              console.error('自动代码高亮失败:', e);
            }
          }
        }
        return code;
      },
      breaks: true,
      gfm: true
    });
    console.log('✅ Markdown 配置完成');
  } else {
    console.warn('⚠️ marked.js 未加载，Markdown 渲染不可用');
  }
}

// 加载设置
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'selectedModel', 'apiEndpoint', 'sendMethod', 'systemPrompt'], (result) => {
      if (result.apiKey) {
        apiKey = result.apiKey;
        apiKeyInput.value = '••••••••';
        updateStatus('✅ API Key 已设置');
      } else {
        updateStatus('⚠️ 请先设置 API Key');
      }
      
      if (result.selectedModel) {
        selectedModel = result.selectedModel;
        modelInput.value = selectedModel;
      }
      
      if (result.apiEndpoint) {
        apiEndpoint = result.apiEndpoint;
        apiEndpointInput.value = result.apiEndpoint;
      } else {
        apiEndpointInput.value = apiEndpoint;
      }
      
      if (result.sendMethod) {
        sendMethod = result.sendMethod;
        sendMethodSelect.value = sendMethod;
      } else {
        sendMethodSelect.value = sendMethod;
      }
      
      // 检查 systemPrompt 是否存在于存储中（包括空字符串）
      if (result.hasOwnProperty('systemPrompt')) {
        systemPrompt = result.systemPrompt;
        systemPromptInput.value = result.systemPrompt;
      } else {
        // 使用默认值
        systemPromptInput.value = systemPrompt;
      }
      
      resolve();
    });
  });
}

// 保存 API Key
saveApiKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key && key !== '••••••••') {
    chrome.storage.sync.set({ apiKey: key }, () => {
      apiKey = key;
      apiKeyInput.value = '••••••••';
      updateStatus('✅ API Key 已保存');
      setTimeout(() => updateStatus(''), 2000);
    });
  }
});

// 保存 API Endpoint
saveEndpointBtn.addEventListener('click', () => {
  const endpoint = apiEndpointInput.value.trim();
  if (endpoint) {
    chrome.storage.sync.set({ apiEndpoint: endpoint }, () => {
      apiEndpoint = endpoint;
      updateStatus('✅ API Endpoint 已保存');
      setTimeout(() => updateStatus(''), 2000);
    });
  }
});

// 保存 System Prompt
saveSystemPromptBtn.addEventListener('click', () => {
  const prompt = systemPromptInput.value.trim();
  // 允许保存空值（用户可以清空 system prompt）
  chrome.storage.sync.set({ systemPrompt: prompt }, () => {
    systemPrompt = prompt;
    updateStatus('✅ System Prompt 已保存');
    setTimeout(() => updateStatus(''), 2000);
  });
});

// 模型输入框 - 输入时筛选
modelInput.addEventListener('input', (e) => {
  const inputValue = e.target.value.trim().toLowerCase();
  updateModelList(inputValue);
});

// 模型输入框 - 按 Enter 选择列表中的第一个
modelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    // 选择列表中的第一个选项
    if (modelList.options.length > 0 && !modelList.options[0].disabled) {
      modelList.selectedIndex = 0;
      const selectedValue = modelList.value;
      if (selectedValue && allModels.includes(selectedValue)) {
        selectedModel = selectedValue;
        modelInput.value = selectedValue;
        chrome.storage.sync.set({ selectedModel });
        updateStatus(`✅ 已切换到 ${selectedModel}`);
        setTimeout(() => updateStatus(''), 2000);
      }
    }
  }
});

// 模型列表框 - 选择时更新输入框和保存
modelList.addEventListener('change', (e) => {
  const value = e.target.value;
  
  if (value && allModels.includes(value)) {
    selectedModel = value;
    modelInput.value = value;
    chrome.storage.sync.set({ selectedModel });
    updateStatus(`✅ 已切换到 ${selectedModel}`);
    setTimeout(() => updateStatus(''), 2000);
  }
});

// 模型列表框 - 双击选择
modelList.addEventListener('dblclick', (e) => {
  const value = modelList.value;
  if (value && allModels.includes(value)) {
    selectedModel = value;
    modelInput.value = value;
    chrome.storage.sync.set({ selectedModel });
    updateStatus(`✅ 已切换到 ${selectedModel}`);
    setTimeout(() => updateStatus(''), 2000);
  }
});

// 发送方式选择
sendMethodSelect.addEventListener('change', (e) => {
  sendMethod = e.target.value;
  chrome.storage.sync.set({ sendMethod });
  const methodText = sendMethod === 'enter' ? 'Enter 发送 (Shift+Enter 换行)' : 'Ctrl+Enter 发送 (Enter 换行)';
  updateStatus(`✅ 已切换到 ${methodText}`);
  setTimeout(() => updateStatus(''), 2000);
});

// 加载模型列表
async function loadModels() {
  if (!apiKey) {
    console.log('未设置 API Key，跳过加载模型列表');
    return;
  }
  
  try {
    updateStatus('🔄 正在加载模型列表...');
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'fetchModels',
          apiKey: apiKey,
          apiEndpoint: apiEndpoint
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
    
    if (response && response.data && Array.isArray(response.data)) {
      // 获取所有模型并排序
      const models = response.data.sort((a, b) => a.id.localeCompare(b.id));
      
      if (models.length > 0) {
        // 存储所有模型用于筛选
        allModels = models.map(m => m.id);
        
        // 更新 datalist
        updateModelList('');
        
        // 恢复之前选择的模型，如果存在的话
        if (selectedModel && allModels.includes(selectedModel)) {
          modelInput.value = selectedModel;
        } else {
          // 如果之前的模型不存在，选择第一个
          selectedModel = allModels[0];
          modelInput.value = selectedModel;
          chrome.storage.sync.set({ selectedModel });
        }
        
        updateStatus(`✅ 已加载 ${allModels.length} 个模型`);
        setTimeout(() => updateStatus(''), 2000);
      } else {
        updateStatus('⚠️ 未找到可用的模型');
        setTimeout(() => updateStatus(''), 3000);
      }
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
    updateStatus('⚠️ 加载模型列表失败: ' + error.message);
    setTimeout(() => updateStatus(''), 3000);
    
    // 使用默认模型列表
    loadDefaultModels();
  }
}

// 加载默认模型列表（作为备用）
function loadDefaultModels() {
  const defaultModels = [
    // OpenAI GPT 系列
    'gpt-4',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo-preview',
    'gpt-3.5-turbo',
    // Anthropic Claude 系列
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    // Google Gemini 系列
    'gemini-pro',
    'gemini-1.5-pro',
    // Meta Llama 系列
    'llama-2-70b-chat',
    'llama-2-13b-chat',
    // Mistral 系列
    'mixtral-8x7b-instruct',
    'mistral-7b-instruct'
  ];
  
  // 存储到全局变量
  allModels = [...defaultModels];
  
  // 更新 datalist
  updateModelList('');
  
  if (selectedModel && defaultModels.includes(selectedModel)) {
    modelInput.value = selectedModel;
  }
}

// 更新模型列表（根据搜索文本筛选）
function updateModelList(searchText) {
  const searchLower = searchText.toLowerCase();
  
  // 清空现有选项
  modelList.innerHTML = '';
  
  // 筛选模型
  let filteredModels = allModels;
  if (searchLower) {
    // 优先显示前缀匹配的模型，然后是包含匹配的模型
    const prefixMatches = allModels.filter(modelId => 
      modelId.toLowerCase().startsWith(searchLower)
    );
    const containsMatches = allModels.filter(modelId => 
      !modelId.toLowerCase().startsWith(searchLower) && 
      modelId.toLowerCase().includes(searchLower)
    );
    filteredModels = [...prefixMatches, ...containsMatches];
  }
  
  // 如果有筛选结果，添加筛选后的选项
  if (filteredModels.length > 0) {
    filteredModels.forEach((modelId, index) => {
      const option = document.createElement('option');
      option.value = modelId;
      option.textContent = modelId;
      // 如果是当前选中的模型，设置为选中状态
      if (modelId === selectedModel) {
        option.selected = true;
      }
      modelList.appendChild(option);
    });
  } else {
    // 没有匹配结果，显示提示
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '❌ 未找到匹配的模型';
    option.disabled = true;
    option.selected = true;
    modelList.appendChild(option);
  }
}

// 刷新模型列表
refreshModelsBtn.addEventListener('click', async () => {
  await loadModels();
});

// 发送方式选择


// 加载页面内容
async function loadPageContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('错误:', chrome.runtime.lastError);
        pageTitleEl.textContent = '无法读取页面内容';
        pageUrlEl.textContent = '请刷新页面后重试';
        return;
      }
      
      if (response) {
        pageContent = response;
        pageTitleEl.textContent = response.title || '无标题';
        pageUrlEl.textContent = response.url || '';
        updateStatus('📖 页面内容已加载');
      }
    });
  } catch (error) {
    console.error('加载页面内容失败:', error);
    addMessage('error', '无法加载页面内容: ' + error.message);
  }
}

// 刷新页面内容
refreshPageBtn.addEventListener('click', async () => {
  updateStatus('🔄 正在重新加载...');
  await loadPageContent();
  chatHistory = [];
  chatMessages.innerHTML = '<div class="system-message">👋 页面内容已刷新！你可以重新提问。</div>';
  activeMessageEditor = null;
});

// 自动调整 textarea 高度
function autoResizeTextarea(textarea) {
  // 重置高度以获取正确的 scrollHeight
  textarea.style.height = 'auto';
  
  // 计算新高度
  const newHeight = Math.min(textarea.scrollHeight, 300); // 最大高度 300px
  
  // 设置新高度
  textarea.style.height = newHeight + 'px';
}

// 设置事件监听器
function setupEventListeners() {
  // 设置按钮切换
  settingsToggleBtn.addEventListener('click', () => {
    settingsSection.classList.toggle('hidden');
  });

  sendButton.addEventListener('click', sendMessage);
  
  // 自动调整输入框高度
  userInput.addEventListener('input', () => {
    autoResizeTextarea(userInput);
  });
  
  userInput.addEventListener('keydown', (e) => {
    if (sendMethod === 'enter') {
      // Enter 发送模式：Enter 发送，Shift+Enter 换行
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    } else {
      // Ctrl+Enter 发送模式：Ctrl+Enter 发送，Enter 换行
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        sendMessage();
      }
    }
  });
}

function validateBeforeSend() {
  if (!apiKey) {
    return '请先设置 API Key';
  }
  
  if (!pageContent) {
    return '页面内容尚未加载，请稍候或刷新';
  }
  
  if (currentStreamingMessageId) {
    return '正在接收上一次回复，请稍候再试';
  }
  
  return null;
}

// 发送消息（来自输入框）
async function sendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;

  const validationError = validateBeforeSend();
  if (validationError) {
    addMessage('error', validationError);
    return;
  }
  
  userInput.value = '';
  // 重置输入框高度
  userInput.style.height = 'auto';
  await sendPreparedMessage(message);
}

// 发送指定文本的消息（编辑或输入通用入口）
async function sendPreparedMessage(message) {
  const validationError = validateBeforeSend();
  if (validationError) {
    addMessage('error', validationError);
    return;
  }

  // 显示用户消息
  const userMessageId = addMessage('user', message);
  console.log('用户消息已添加，ID:', userMessageId);
  const userMessageElement = document.getElementById(userMessageId);
  
  // 禁用输入
  setInputEnabled(false);
  
  // 更新用户消息历史
  const historyIndex = chatHistory.push({ role: 'user', content: message }) - 1;
  
  if (userMessageElement) {
    registerUserMessage(userMessageElement, historyIndex, message);
  }
  
  // 创建助手消息占位符，显示等待提示
  currentStreamingMessageId = addMessage('assistant', '等待回复...');
  console.log('助手消息占位符已创建，ID:', currentStreamingMessageId);
  currentStreamingContent = '';
  
  // 在调用 API 之前设置状态
  updateStatus('🤖 正在接收回复...');
  
  try {
    // 构建消息历史
    const messages = buildMessages();
    
    // 调用流式 API
    await callStreamAPI(messages);
  } catch (error) {
    if (currentStreamingMessageId) {
      removeMessage(currentStreamingMessageId);
    }
    currentStreamingMessageId = null;
    currentStreamingContent = '';
    
    addMessage('error', '错误: ' + error.message);
    console.error('API 调用失败:', error);
    
    // 清除状态
    updateStatus('');
    setInputEnabled(true);
    userInput.focus();
  }
}

// 构建消息数组
function buildMessages() {
  const systemMessage = {
    role: 'system',
    content: `你是一个智能助手，正在帮助用户理解和分析当前网页的内容。

网页信息：
标题: ${pageContent.title}
URL: ${pageContent.url}
描述: ${pageContent.description}

网页主要内容:
${pageContent.mainText}

请基于以上网页内容回答用户的问题。如果问题与网页内容无关，也可以进行一般性回答。回答要简洁、准确、有帮助。

${systemPrompt ? '\n用户要求：' + systemPrompt : ''}`
  };
  
  const messages = [systemMessage, ...chatHistory];
  
  return messages;
}

// 调用流式 API
async function callStreamAPI(messages) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'callOpenAIAPIStream',
        messages: messages,
        model: selectedModel,
        apiKey: apiKey,
        apiEndpoint: apiEndpoint,
        tabId: chrome.devtools?.inspectedWindow?.tabId || 0
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.success) {
          resolve();
        } else if (response && !response.success) {
          reject(new Error(response.error));
        }
      }
    );
  });
}

// 调用 API（保留非流式版本作为备用）
async function callAPI(messages) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'callOpenAIAPI',
        messages: messages,
        model: selectedModel,
        apiKey: apiKey,
        apiEndpoint: apiEndpoint
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      }
    );
  });
}

// 添加消息到聊天
function addMessage(type, content) {
  const messageDiv = document.createElement('div');
  // 生成唯一 ID，包含类型和时间戳，并添加随机数避免冲突
  const messageId = type + '-msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  messageDiv.id = messageId;
  
  console.log('添加消息:', type, 'ID:', messageId);
  
  switch (type) {
    case 'user':
      messageDiv.className = 'message user-message';
      messageDiv.textContent = content;
      messageDiv.dataset.messageType = 'user';
      messageDiv.dataset.originalContent = content;
      break;
    case 'assistant':
      messageDiv.className = 'message assistant-message markdown-content';
      messageDiv.dataset.messageType = 'assistant';
      // 使用 marked.js 渲染 Markdown
      if (typeof marked !== 'undefined') {
        try {
          console.log('正在渲染 Markdown 内容（使用 marked.js）...');
          const html = marked.parse(content);
          console.log('Markdown 解析成功，HTML 长度:', html.length);
          messageDiv.innerHTML = html;
          
          // 对所有未高亮的代码块应用高亮
          if (typeof hljs !== 'undefined') {
            messageDiv.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
              hljs.highlightElement(block);
            });
            console.log('代码高亮应用成功');
          }
        } catch (e) {
          console.error('Markdown 解析失败:', e);
          // 降级到纯文本显示
          messageDiv.textContent = content;
        }
      } else if (typeof simpleMarkdown !== 'undefined') {
        // 使用本地备用 Markdown 渲染器
        try {
          console.log('正在渲染 Markdown 内容（使用备用渲染器）...');
          const html = simpleMarkdown.render(content);
          messageDiv.innerHTML = html;
          console.log('备用 Markdown 渲染成功');
        } catch (e) {
          console.error('备用 Markdown 渲染失败:', e);
          messageDiv.textContent = content;
        }
      } else {
        console.warn('marked 和备用渲染器都不可用，使用纯文本显示');
        messageDiv.textContent = content;
      }
      break;
    case 'loading':
      messageDiv.className = 'loading-message';
      messageDiv.textContent = content;
      break;
    case 'error':
      messageDiv.className = 'error-message';
      messageDiv.textContent = content;
      break;
    default:
      messageDiv.className = 'message';
      messageDiv.textContent = content;
  }
  
  chatMessages.appendChild(messageDiv);
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageId;
}

function registerUserMessage(messageElement, historyIndex, content) {
  if (!messageElement) return;
  messageElement.dataset.historyIndex = historyIndex;
  messageElement.dataset.originalContent = content;
  messageElement.removeEventListener('click', handleUserMessageClick);
  messageElement.addEventListener('click', handleUserMessageClick);
}

function handleUserMessageClick(event) {
  const messageElement = event.currentTarget;
  if (!messageElement) return;
  startEditingUserMessage(messageElement);
}

function startEditingUserMessage(messageElement) {
  if (!messageElement || messageElement.dataset.messageType !== 'user') return;
  if (currentStreamingMessageId) {
    updateStatus('⚠️ 正在接收回复，请稍后再编辑');
    return;
  }
  
  if (activeMessageEditor && activeMessageEditor.messageDiv === messageElement) {
    return;
  }
  
  if (activeMessageEditor) {
    clearActiveMessageEditor();
  }
  
  const originalText = messageElement.dataset.originalContent || messageElement.textContent || '';
  const textarea = document.createElement('textarea');
  textarea.className = 'message-editor';
  textarea.value = originalText;
  messageElement.innerHTML = '';
  messageElement.classList.add('editing');
  messageElement.appendChild(textarea);
  
  const autoResizeHandler = () => autoResizeEditor(textarea);
  autoResizeHandler();
  
  const keydownHandler = (e) => {
    const isSendShortcut = sendMethod === 'enter'
      ? (e.key === 'Enter' && !e.shiftKey)
      : (e.key === 'Enter' && (e.ctrlKey || e.metaKey));
    
    if (isSendShortcut) {
      e.preventDefault();
      submitEditedMessage(messageElement, textarea.value).catch((error) => {
        console.error('重新发送编辑内容失败:', error);
      });
      return;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      clearActiveMessageEditor();
    }
  };
  
  const blurHandler = () => {
    clearActiveMessageEditor();
  };
  
  textarea.addEventListener('keydown', keydownHandler);
  textarea.addEventListener('blur', blurHandler);
  textarea.addEventListener('input', autoResizeHandler);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  
  activeMessageEditor = {
    messageDiv: messageElement,
    textarea,
    originalText,
    keydownHandler,
    blurHandler,
    inputHandler: autoResizeHandler
  };
  
  updateStatus('✏️ 编辑模式：使用快捷键发送，Esc 取消');
}

function clearActiveMessageEditor(options = {}) {
  if (!activeMessageEditor) return;
  const { messageDiv, textarea, originalText, keydownHandler, blurHandler, inputHandler } = activeMessageEditor;
  
  textarea.removeEventListener('keydown', keydownHandler);
  textarea.removeEventListener('blur', blurHandler);
  textarea.removeEventListener('input', inputHandler);
  
  messageDiv.classList.remove('editing');
  if (options.restoreContent !== false) {
    messageDiv.textContent = originalText;
    messageDiv.dataset.originalContent = originalText;
  }
  
  activeMessageEditor = null;
  if (!options.keepStatus) {
    updateStatus('');
  }
}

async function submitEditedMessage(messageElement, newContent) {
  if (!messageElement) return;
  const trimmedContent = (newContent || '').trim();
  const originalText = messageElement.dataset.originalContent || '';

  if (!trimmedContent) {
    updateStatus('⚠️ 消息内容不能为空');
    clearActiveMessageEditor({ keepStatus: true });
    return;
  }

  if (trimmedContent === originalText.trim()) {
    clearActiveMessageEditor();
    return;
  }

  const validationError = validateBeforeSend();
  if (validationError) {
    clearActiveMessageEditor();
    addMessage('error', validationError);
    return;
  }
  
  const historyIndex = Number(messageElement.dataset.historyIndex);
  if (Number.isNaN(historyIndex)) {
    clearActiveMessageEditor();
    console.warn('无法确定消息的历史索引，取消编辑发送');
    return;
  }

  clearActiveMessageEditor({ restoreContent: false });
  truncateChatHistoryFrom(historyIndex);
  removeMessagesFrom(messageElement);
  
  await sendPreparedMessage(trimmedContent);
}

function truncateChatHistoryFrom(index) {
  if (index < 0) return;
  chatHistory = chatHistory.slice(0, index);
}

function removeMessagesFrom(messageElement) {
  if (!messageElement) return;
  let node = messageElement;
  while (node) {
    const next = node.nextElementSibling;
    if (node.id === currentStreamingMessageId) {
      currentStreamingMessageId = null;
      currentStreamingContent = '';
    }
    node.remove();
    node = next;
  }
}

function autoResizeEditor(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = Math.max(textarea.scrollHeight, 48) + 'px';
}

// 移除消息
function removeMessage(messageId) {
  const element = document.getElementById(messageId);
  if (element) {
    element.remove();
  }
}

// 启用/禁用输入
function setInputEnabled(enabled) {
  userInput.disabled = !enabled;
  sendButton.disabled = !enabled;
}

// 更新状态栏
function updateStatus(message) {
  statusBar.textContent = message;
}
