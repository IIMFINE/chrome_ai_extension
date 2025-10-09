# 模型选择下拉框 - 空白状态优化

## 🔄 更新内容

根据新需求，优化了模型选择下拉框的交互行为：

### 之前的行为
- 点击下拉框时，自动选中第一个模型或之前选择的模型
- 用户需要先看到一个已选中的模型

### 现在的行为
- ✅ 点击下拉框时，显示空白提示："**输入字母搜索模型...**"
- ✅ 输入文字搜索时，自动清除空白状态，显示搜索结果
- ✅ 更直观地引导用户进行搜索操作

## 📝 详细说明

### 1. 空白状态显示

点击"选择模型"下拉框时：

```
┌─────────────────────────────┐
│ 输入字母搜索模型...      ▼ │  ← 空白提示（灰色斜体）
│ gemini-1.5-flash-002        │
│ gemini-1.5-flash-8b         │
│ gemini-1.5-flash-latest     │
│ gemini-1.5-pro              │
│ ...                         │
└─────────────────────────────┘
```

### 2. 输入搜索后

输入字母后，空白提示消失，显示搜索结果：

```
┌─────────────────────────────┐
│ 🔍 搜索: gpt              ▼ │  ← 搜索提示
│ gpt-4                       │
│ gpt-4o                      │
│ gpt-4o-mini                 │
│ gpt-4-turbo-preview         │
│ gpt-3.5-turbo               │
└─────────────────────────────┘
```

### 3. 选择模型后

选择模型后，下次打开仍显示空白提示（但会记住选择的模型）：

```
┌─────────────────────────────┐
│ 输入字母搜索模型...      ▼ │  ← 空白提示
│ gemini-1.5-flash-002        │
│ gemini-1.5-flash-8b         │
│ ...                         │
│ gpt-4                    ✓  │  ← 之前选择的模型（已保存）
│ ...                         │
└─────────────────────────────┘
```

## 🎨 视觉效果

### 空白提示选项
- 文字：`输入字母搜索模型...`
- 颜色：灰色 (#999)
- 样式：斜体
- 背景：浅灰色 (#fafafa)
- 状态：禁用（不可直接选择）

### 搜索提示选项
- 文字：`🔍 搜索: xxx`
- 颜色：蓝色 (#667eea)
- 样式：加粗
- 背景：浅灰色 (#f8f9fa)

## 💡 代码实现

### 1. 空白状态生成 (filterModels 函数)

```javascript
if (!searchLower) {
  // 添加空白提示选项
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = '输入字母搜索模型...';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.style.color = '#999';
  placeholderOption.style.fontStyle = 'italic';
  modelSelect.appendChild(placeholderOption);
  
  // 添加所有模型
  allModels.forEach(modelId => {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelId;
    modelSelect.appendChild(option);
  });
  
  // 如果之前有选择的模型，恢复选择
  if (selectedModel && allModels.includes(selectedModel)) {
    modelSelect.value = selectedModel;
  }
}
```

### 2. 焦点事件处理

```javascript
// 模型选择框获得焦点时显示空白状态
modelSelect.addEventListener('focus', () => {
  // 如果没有正在搜索，显示空白提示
  if (!filterText) {
    filterModels('');
  }
});
```

### 3. 选择事件处理

```javascript
modelSelect.addEventListener('change', (e) => {
  const value = e.target.value;
  
  // 如果选中的是空白提示选项，不做任何操作
  if (value === '') {
    return;
  }
  
  // 其他选择逻辑...
});
```

### 4. CSS 样式

```css
/* 空白提示选项 */
select option[value=""] {
  color: #999;
  font-style: italic;
  background: #fafafa;
}
```

## ✨ 用户体验提升

### 优点
1. **引导性更强** - 空白提示明确告诉用户可以搜索
2. **减少干扰** - 不会默认选中任何模型，视觉更清爽
3. **操作直观** - 输入即搜索，自然流畅
4. **保留记忆** - 虽然显示空白，但仍记住用户之前的选择

### 使用流程
```
1. 点击下拉框
   ↓
2. 看到"输入字母搜索模型..."提示
   ↓
3. 输入字母（如：g）
   ↓
4. 空白提示消失，显示"🔍 搜索: g"
   ↓
5. 列表实时筛选显示匹配的模型
   ↓
6. 选择模型 → 搜索清除 → 下次打开再次显示空白提示
```

## 🧪 测试场景

### 场景 1：首次使用
1. 打开侧边栏
2. 点击"选择模型"下拉框
3. **预期**：显示"输入字母搜索模型..."提示
4. 输入 `gpt`
5. **预期**：空白提示消失，显示搜索结果

### 场景 2：已有选择的模型
1. 之前已选择 `gpt-4`
2. 点击"选择模型"下拉框
3. **预期**：显示空白提示，但 `gpt-4` 已被标记为选中
4. 输入搜索文字
5. **预期**：正常搜索筛选

### 场景 3：搜索后清除
1. 输入 `claude` 搜索
2. 按 Escape 清除
3. **预期**：恢复显示空白提示和所有模型

### 场景 4：选择模型
1. 输入 `gpt` 搜索
2. 选择 `gpt-4o`
3. **预期**：
   - 模型被保存
   - 搜索自动清除
   - 状态栏显示"✅ 已切换到 gpt-4o"

## 📋 修改的文件

### 1. sidepanel.js
- ✅ 修改 `filterModels()` 函数 - 添加空白提示选项
- ✅ 新增 `focus` 事件监听 - 获得焦点时显示空白状态
- ✅ 修改 `change` 事件 - 处理空白选项
- ✅ 修改 `keydown` 事件 - Enter 键处理空白选项

### 2. sidepanel.css
- ✅ 新增空白提示选项样式

## 🎯 总结

这次优化使得模型选择下拉框的行为更加符合搜索框的直觉：
- **空白状态** = 引导用户输入搜索
- **搜索状态** = 实时显示筛选结果
- **选择后** = 记住选择，但下次打开仍显示搜索引导

用户体验更加流畅自然！🎉
