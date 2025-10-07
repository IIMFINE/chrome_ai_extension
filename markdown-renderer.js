// 简单的 Markdown 渲染器（无需外部依赖）
// 用于在 CDN 加载失败时作为备用方案

class SimpleMarkdownRenderer {
  constructor() {
    this.rules = [
      // 标题
      { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
      { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
      { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
      
      // 粗体
      { pattern: /\*\*\*(.+?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
      { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
      { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
      
      // 斜体
      { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
      { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },
      
      // 删除线
      { pattern: /~~(.+?)~~/g, replacement: '<del>$1</del>' },
      
      // 行内代码
      { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
      
      // 链接
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank">$1</a>' },
      
      // 图片
      { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: '<img src="$2" alt="$1" />' },
      
      // 分割线
      { pattern: /^---$/gm, replacement: '<hr>' },
      { pattern: /^\*\*\*$/gm, replacement: '<hr>' },
      
      // 换行
      { pattern: /\n\n/g, replacement: '</p><p>' },
      { pattern: /\n/g, replacement: '<br>' }
    ];
  }

  // 处理代码块
  processCodeBlocks(text) {
    // 匹配代码块 ```language\ncode\n```
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let index = 0;
    
    // 提取代码块
    text = text.replace(codeBlockPattern, (match, language, code) => {
      const placeholder = `__CODEBLOCK_${index}__`;
      codeBlocks.push({ language: language || '', code: code.trim() });
      index++;
      return placeholder;
    });
    
    return { text, codeBlocks };
  }

  // 处理列表
  processLists(text) {
    // 无序列表
    text = text.replace(/^\* (.+)$/gm, '<li>$1</li>');
    text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 有序列表
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    return text;
  }

  // 处理引用
  processBlockquotes(text) {
    text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    text = text.replace(/(<blockquote>.*<\/blockquote>\n?)+/g, '<blockquote>$&</blockquote>');
    return text;
  }

  // 主渲染函数
  render(markdown) {
    if (!markdown) return '';
    
    // 处理代码块（先提取，避免被其他规则影响）
    const { text: processedText, codeBlocks } = this.processCodeBlocks(markdown);
    let html = processedText;
    
    // 处理引用
    html = this.processBlockquotes(html);
    
    // 处理列表
    html = this.processLists(html);
    
    // 应用其他规则
    this.rules.forEach(rule => {
      html = html.replace(rule.pattern, rule.replacement);
    });
    
    // 恢复代码块
    codeBlocks.forEach((block, index) => {
      const codeHtml = `<pre><code class="language-${block.language}">${this.escapeHtml(block.code)}</code></pre>`;
      html = html.replace(`__CODEBLOCK_${index}__`, codeHtml);
    });
    
    // 包装段落
    html = '<p>' + html + '</p>';
    
    // 清理多余的空段落
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }

  // HTML 转义
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// 创建全局实例
window.simpleMarkdown = new SimpleMarkdownRenderer();
