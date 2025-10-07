// Content Script - 提取网页内容
(function() {
  'use strict';

  // 提取网页的主要文本内容
  function extractPageContent() {
    const content = {
      title: document.title,
      url: window.location.href,
      description: getMetaDescription(),
      mainText: getMainText(),
      timestamp: new Date().toISOString()
    };
    
    return content;
  }

  // 获取网页描述
  function getMetaDescription() {
    const metaDescription = document.querySelector('meta[name="description"]');
    return metaDescription ? metaDescription.content : '';
  }

  // 提取主要文本内容
  function getMainText() {
    // 移除脚本、样式等不需要的元素
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, svg');
    elementsToRemove.forEach(el => el.remove());
    
    // 获取文本内容
    let text = clone.innerText || clone.textContent || '';
    
    // 清理多余的空白
    text = text.replace(/\s+/g, ' ').trim();
    
    // 限制文本长度（避免太长）
    const maxLength = 10000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    
    return text;
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      const content = extractPageContent();
      sendResponse(content);
    }
    return true; // 保持消息通道开放
  });

  console.log('OpenAI 网页助手 - Content Script 已加载');
})();
