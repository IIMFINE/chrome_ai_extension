// Popup.js - 主要交互逻辑
let pageContent = null;
let chatHistory = [];
let apiKey = '';
let selectedModel = 'gpt-4';
let apiEndpoint = 'https://api.openai.com/v1/chat/completions';
let sendMethod = 'enter'; // 'enter' or 'ctrl-enter'
let currentStreamingMessageId = null; // 当前正在流式接收的消息 ID
let currentStreamingContent = ''; // 当前流式接收的内容

// DOM 元素
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiEndpointInput = document.getElementById('apiEndpoint');
const saveEndpointBtn = document.getElementById('saveEndpoint');
const modelSelect = document.getElementById('modelSelect');
const modelSearchInput = document.getElementById('modelSearch');
const refreshModelsBtn = document.getElementById('refreshModels');
const sendMethodSelect = document.getElementById('sendMethod');
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

  // 最终渲染（在 popup.js 中不使用 Markdown）
  finalizeStreamingMessage(currentStreamingMessageId, currentStreamingContent);
  
  // 更新聊天历史
  chatHistory.push({ role: 'assistant', content: currentStreamingContent });
  
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
  
  // 启用输入
  setInputEnabled(true);
  userInput.focus();
}

// 更新流式消息
function updateStreamingMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (!messageDiv) return;
  
  // 直接显示文本内容
  messageDiv.textContent = content;
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 最终化流式消息
function finalizeStreamingMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (!messageDiv) return;
  
  // popup.js 保持纯文本显示
  messageDiv.textContent = content;
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 加载设置
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'selectedModel', 'apiEndpoint', 'sendMethod'], (result) => {
      if (result.apiKey) {
        apiKey = result.apiKey;
        apiKeyInput.value = '••••••••';
        updateStatus('✅ API Key 已设置');
      } else {
        updateStatus('⚠️ 请先设置 API Key');
      }
      
      if (result.selectedModel) {
        selectedModel = result.selectedModel;
        modelSelect.value = selectedModel;
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

// 模型选择
modelSelect.addEventListener('change', (e) => {
  selectedModel = e.target.value;
  chrome.storage.sync.set({ selectedModel });
  updateStatus(`✅ 已切换到 ${selectedModel}`);
  setTimeout(() => updateStatus(''), 2000);
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
        
        // 清空现有选项
        modelSelect.innerHTML = '';
        
        // 添加新选项
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = model.id;
          modelSelect.appendChild(option);
        });
        
        // 恢复之前选择的模型，如果存在的话
        if (selectedModel && allModels.includes(selectedModel)) {
          modelSelect.value = selectedModel;
        } else {
          // 如果之前的模型不存在，选择第一个
          selectedModel = allModels[0];
          modelSelect.value = selectedModel;
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
  
  modelSelect.innerHTML = '';
  defaultModels.forEach(modelId => {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelId;
    modelSelect.appendChild(option);
  });
  
  if (selectedModel && defaultModels.includes(selectedModel)) {
    modelSelect.value = selectedModel;
  }
}

// 刷新模型列表
refreshModelsBtn.addEventListener('click', async () => {
  await loadModels();
});

// 模型搜索筛选
modelSearchInput.addEventListener('input', (e) => {
  filterModels(e.target.value);
});

// 筛选模型列表
function filterModels(searchText) {
  const searchLower = searchText.toLowerCase().trim();
  
  // 清空当前选项
  modelSelect.innerHTML = '';
  
  // 如果没有搜索文本，显示所有模型
  if (!searchLower) {
    allModels.forEach(modelId => {
      const option = document.createElement('option');
      option.value = modelId;
      option.textContent = modelId;
      modelSelect.appendChild(option);
    });
  } else {
    // 根据搜索文本筛选模型
    const filteredModels = allModels.filter(modelId => 
      modelId.toLowerCase().includes(searchLower)
    );
    
    if (filteredModels.length > 0) {
      filteredModels.forEach(modelId => {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = modelId;
        modelSelect.appendChild(option);
      });
    } else {
      // 没有匹配的模型
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '未找到匹配的模型';
      option.disabled = true;
      modelSelect.appendChild(option);
    }
  }
  
  // 尝试恢复之前选择的模型
  if (selectedModel && allModels.includes(selectedModel)) {
    const options = Array.from(modelSelect.options);
    const matchingOption = options.find(opt => opt.value === selectedModel);
    if (matchingOption) {
      modelSelect.value = selectedModel;
    } else if (modelSelect.options.length > 0 && !modelSelect.options[0].disabled) {
      // 如果之前的模型不在筛选结果中，选择第一个
      modelSelect.selectedIndex = 0;
    }
  } else if (modelSelect.options.length > 0 && !modelSelect.options[0].disabled) {
    modelSelect.selectedIndex = 0;
  }
}


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
});

// 设置事件监听器
function setupEventListeners() {
  sendButton.addEventListener('click', sendMessage);
  
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

// 发送消息
async function sendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;
  
  if (!apiKey) {
    addMessage('error', '请先设置 API Key');
    return;
  }
  
  if (!pageContent) {
    addMessage('error', '页面内容尚未加载，请稍候或刷新');
    return;
  }
  
  // 显示用户消息
  addMessage('user', message);
  userInput.value = '';
  
  // 禁用输入
  setInputEnabled(false);
  
  // 更新用户消息历史
  chatHistory.push({ role: 'user', content: message });
  
  // 创建助手消息占位符
  currentStreamingMessageId = addMessage('assistant', '');
  currentStreamingContent = '';
  
  try {
    // 构建消息历史
    const messages = buildMessages(message);
    
    // 调用流式 API
    await callStreamAPI(messages);
    
    updateStatus('🤖 正在接收回复...');
  } catch (error) {
    if (currentStreamingMessageId) {
      removeMessage(currentStreamingMessageId);
    }
    currentStreamingMessageId = null;
    currentStreamingContent = '';
    
    addMessage('error', '错误: ' + error.message);
    console.error('API 调用失败:', error);
    
    setInputEnabled(true);
    userInput.focus();
  }
}

// 构建消息数组
function buildMessages(userMessage) {
  const systemMessage = {
    role: 'system',
    content: `你是一个智能助手，正在帮助用户理解和分析当前网页的内容。

网页信息：
标题: ${pageContent.title}
URL: ${pageContent.url}
描述: ${pageContent.description}

网页主要内容:
${pageContent.mainText}

请基于以上网页内容回答用户的问题。如果问题与网页内容无关，也可以进行一般性回答。回答要简洁、准确、有帮助。`
  };
  
  const messages = [systemMessage, ...chatHistory, { role: 'user', content: userMessage }];
  
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
  const messageId = 'msg-' + Date.now();
  messageDiv.id = messageId;
  
  switch (type) {
    case 'user':
      messageDiv.className = 'message user-message';
      break;
    case 'assistant':
      messageDiv.className = 'message assistant-message';
      break;
    case 'loading':
      messageDiv.className = 'loading-message';
      break;
    case 'error':
      messageDiv.className = 'error-message';
      break;
    default:
      messageDiv.className = 'message';
  }
  
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageId;
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
