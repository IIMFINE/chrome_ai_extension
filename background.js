// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI网页助手已安装');
  
  // 设置默认配置
  chrome.storage.sync.get(['apiKey', 'selectedModel', 'apiEndpoint'], (result) => {
    if (!result.selectedModel) {
      chrome.storage.sync.set({
        selectedModel: 'gpt-4'
      });
    }
    if (!result.apiEndpoint) {
      chrome.storage.sync.set({
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
      });
    }
  });
});

// 点击扩展图标时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callOpenAIAPI') {
    callOpenAIAPI(request.messages, request.model, request.apiKey, request.apiEndpoint)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'callOpenAIAPIStream') {
    callOpenAIAPIStream(request.messages, request.model, request.apiKey, request.apiEndpoint, request.tabId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'fetchModels') {
    fetchModels(request.apiKey, request.apiEndpoint)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放
  }
});

// 调用 OpenAI 兼容 API（非流式）
async function callOpenAIAPI(messages, model, apiKey, apiEndpoint) {
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }

  // 使用默认 endpoint 如果没有提供
  const endpoint = apiEndpoint || 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(endpoint, {
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

// 调用 OpenAI 兼容 API（流式）
async function callOpenAIAPIStream(messages, model, apiKey, apiEndpoint, tabId) {
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }

  // 使用默认 endpoint 如果没有提供
  const endpoint = apiEndpoint || 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: messages,
      model: model,
      temperature: 0.7,
      max_tokens: 4000,  // 增加 token 限制以避免截断
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
  }

  // 处理流式响应
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // 发送完成信号
        chrome.runtime.sendMessage({
          action: 'streamComplete',
          tabId: tabId
        });
        break;
      }

      // 解码数据块
      buffer += decoder.decode(value, { stream: true });
      
      // 按行分割数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.substring(6);
            const data = JSON.parse(jsonStr);
            
            // 提取内容
            if (data.choices && data.choices[0]?.delta?.content) {
              const content = data.choices[0].delta.content;
              
              // 发送数据块到前端
              chrome.runtime.sendMessage({
                action: 'streamChunk',
                content: content,
                tabId: tabId
              });
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e, trimmedLine);
          }
        }
      }
    }
  } catch (error) {
    // 发送错误信号
    chrome.runtime.sendMessage({
      action: 'streamError',
      error: error.message,
      tabId: tabId
    });
    throw error;
  }
}

// 获取可用的模型列表
async function fetchModels(apiKey, apiEndpoint) {
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }

  // 从 chat completions endpoint 推导出 models endpoint
  let modelsEndpoint;
  if (apiEndpoint && apiEndpoint.includes('/chat/completions')) {
    modelsEndpoint = apiEndpoint.replace('/chat/completions', '/models');
  } else if (apiEndpoint && apiEndpoint.includes('/v1')) {
    modelsEndpoint = apiEndpoint.replace(/\/v1.*/, '/v1/models');
  } else {
    modelsEndpoint = 'https://api.openai.com/v1/models';
  }

  const response = await fetch(modelsEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`获取模型列表失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}
