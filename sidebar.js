function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function getImageUrl(url) {
  if (url) return url;
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="80" height="80" fill="#f5f5f5"/>' +
    '<text x="40" y="45" text-anchor="middle" fill="#999" font-size="12">无图片</text></svg>'
  );
}

function truncateText(text, maxLength = 200) {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}

let appwrite = null;
let currentProductData = null;
let savedDocuments = [];
let filteredDocuments = [];
let isTestMode = false;

function getAsinFromUrl(url) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /[?&]asin=([A-Z0-9]{10})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

async function loadTestModeData() {
  const result = await chrome.storage.local.get(['testModeProductData', 'testModeSavedDocs']);
  currentProductData = result.testModeProductData || null;
  savedDocuments = result.testModeSavedDocs || [];
  filteredDocuments = [...savedDocuments];
  
  console.log('[TEST MODE] Loading data from chrome.storage');
  console.log('[TEST MODE] Current product data:', currentProductData);
  console.log('[TEST MODE] Saved documents:', savedDocuments.length);
  
  if (currentProductData) {
    render(currentProductData);
  } else {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="test-mode-banner">🧪 测试模式：商品数据为空</div>';
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = true;
    document.getElementById('saveBtn').disabled = true;
  }
  
  renderSavedList();
}

async function saveTestModeMarkdown(asin, title, content, url, images) {
  const newDoc = {
    asin,
    title,
    content,
    url,
    images,
    createdAt: new Date().toISOString()
  };
  
  const result = await chrome.storage.local.get(['testModeSavedDocs']);
  const docs = result.testModeSavedDocs || [];
  docs.push(newDoc);
  
  await chrome.storage.local.set({ testModeSavedDocs: docs });
  
  console.log('[TEST MODE] Saved document:', asin);
  return newDoc;
}

async function getTestModeMarkdowns() {
  const result = await chrome.storage.local.get(['testModeSavedDocs']);
  return result.testModeSavedDocs || [];
}

async function deleteTestModeMarkdown(asin) {
  const result = await chrome.storage.local.get(['testModeSavedDocs']);
  let docs = result.testModeSavedDocs || [];
  docs = docs.filter(doc => doc.asin !== asin);
  await chrome.storage.local.set({ testModeSavedDocs: docs });
  console.log('[TEST MODE] Deleted document:', asin);
}

function render(data) {
  const content = document.getElementById('content');
  
  if (data.type === 'error') {
    content.innerHTML = `<div class="error">错误: ${escapeHtml(data.message)}</div>`;
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = !isTestMode;
    document.getElementById('saveBtn').disabled = !isTestMode;
    return;
  }
  
  if (data.type === 'unknown') {
    content.innerHTML = `<div class="empty-state">未识别页面类型或无商品信息。请确保在 Amazon 商品列表页或详情页使用。</div>`;
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = !isTestMode;
    document.getElementById('saveBtn').disabled = !isTestMode;
    return;
  }
  
  if (data.type === 'list') {
    if (!data.items || data.items.length === 0) {
      content.innerHTML = '<div class="empty-state">未找到商品信息</div>';
      document.getElementById('downloadBtn').disabled = true;
      document.getElementById('refreshBtn').disabled = !isTestMode;
      document.getElementById('saveBtn').disabled = !isTestMode;
      return;
    }
    content.innerHTML = data.items.map(item => {
      const safeLink = isValidUrl(item.link) ? item.link : '#';
      const displayTitle = escapeHtml(truncateText(item.title, 150));
      return `<div class="product-item">
        <img src="${getImageUrl(item.img)}" width="80" height="80" alt="${displayTitle}" />
        <div class="product-info">
          <a href="${escapeHtml(safeLink)}" target="_blank">${displayTitle}</a>
          <div class="price">${escapeHtml(item.price)}</div>
        </div>
      </div>`;
    }).join('<hr class="divider">');
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('saveBtn').disabled = !isTestMode;
    return;
  }
  
  if (data.type === 'detail') {
    const item = data.item;
    const displayTitle = escapeHtml(truncateText(item.title, 200));
    
    let html = `<div class="product-detail">
      <h3>${displayTitle}</h3>
      <div class="price">${escapeHtml(item.price)}</div>`;
    
    if (item.images && item.images.length > 0) {
      html += `<div class="section"><strong>商品图片 (${item.images.length}):</strong><div class="image-gallery">`;
      item.images.forEach(img => {
        const imgLabel = img.type === 'main' ? '主图' : img.type;
        html += `<div class="image-item">
          <img src="${getImageUrl(img.url)}" width="60" height="60" alt="${escapeHtml(imgLabel)}" />
          <span class="image-label">${escapeHtml(imgLabel)}</span>
        </div>`;
      });
      html += `</div></div>`;
    }
    
    if (item.videos && item.videos.length > 0) {
      html += `<div class="section"><strong>商品视频 (${item.videos.length}):</strong><ul class="video-list">`;
      item.videos.forEach(video => {
        html += `<li><a href="${escapeHtml(video.url)}" target="_blank">${video.thumbnail ? '视频缩略图' : '视频链接'}</a></li>`;
      });
      html += `</ul></div>`;
    }
    
    if (item.bulletPoints && item.bulletPoints.length > 0) {
      html += `<div class="section"><strong>核心卖点:</strong><ul>${item.bulletPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`;
    }
    
    if (item.productDetails && item.productDetails.length > 0) {
      html += `<div class="section"><strong>商品信息 (${item.productDetails.length}):</strong><div class="product-details-table">`;
      item.productDetails.forEach(detail => {
        html += `<div class="detail-row">
          <span class="detail-label">${escapeHtml(detail.label)}</span>
          <span class="detail-value">${escapeHtml(detail.value)}</span>
        </div>`;
      });
      html += `</div></div>`;
    }
    
    if (item.reviews && item.reviews.length > 0) {
      html += `<div class="section"><strong>买家评论 (${item.reviews.length}):</strong><div class="reviews">`;
      item.reviews.forEach(review => {
        html += `<div class="review-item">
          <div class="review-header">
            <strong>${escapeHtml(review.reviewer || '匿名用户')}</strong>
            <span class="rating">${escapeHtml(review.rating)}</span>
          </div>
          <div class="review-title">${escapeHtml(review.title)}</div>
          <div class="review-date">${escapeHtml(review.date)}</div>
          ${review.verified ? `<div class="verified">${escapeHtml(review.verified)}</div>` : ''}
          <div class="review-content">${escapeHtml(review.content)}</div>
          ${review.helpful ? `<div class="review-helpful">${escapeHtml(review.helpful)}</div>` : ''}
        </div>`;
      });
      html += `</div></div>`;
    }
    
    html += `</div>`;
    content.innerHTML = html;
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('saveBtn').disabled = !isTestMode;
    return;
  }
}

function showLoading(text = '正在加载...') {
  document.getElementById('content').innerHTML = `<div class="loading">${text}</div>`;
  document.getElementById('downloadBtn').disabled = true;
  document.getElementById('refreshBtn').disabled = true;
  document.getElementById('saveBtn').disabled = true;
}

function toMarkdown(data) {
  if (data.type === 'list') {
    return data.items.map(item =>
      `![商品图片](${item.img})  
[${item.title}](${item.link})  
 价格: ${item.price}\n`
    ).join('\n---\n');
  } else if (data.type === 'detail') {
    const item = data.item;
    let md = `# ${item.title}
 价格: ${item.price}
 
 ## 核心卖点
 ${item.bulletPoints.map(p => `- ${p}`).join('\n')}
 `;
    
    if (item.productDetails && item.productDetails.length > 0) {
      md += `\n## 商品信息\n\n`;
      item.productDetails.forEach(detail => {
        md += `- **${detail.label}**: ${detail.value}\n`;
      });
    }
    
    if (item.images && item.images.length > 0) {
      md += `\n## 商品图片\n`;
      item.images.forEach((img, i) => {
        const label = img.type === 'main' ? '主图' : `${img.type} ${i}`;
        md += `![${label}](${img.url})\n`;
      });
    }
    
    if (item.videos && item.videos.length > 0) {
      md += `\n## 商品视频\n`;
      item.videos.forEach((video, i) => {
        md += `- [视频${i + 1}](${video.url})\n`;
      });
    }
    
    if (item.reviews && item.reviews.length > 0) {
      md += `\n## 买家评论\n\n`;
      item.reviews.forEach((review, i) => {
        md += `### 评论 ${i + 1}\n`;
        if (review.reviewer) md += `- 评论者: ${review.reviewer}\n`;
        if (review.rating) md += `- 评分: ${review.rating}\n`;
        if (review.title) md += `- 标题: ${review.title}\n`;
        if (review.date) md += `- 日期: ${review.date}\n`;
        if (review.verified) md += `- ${review.verified}\n`;
        md += `- 内容: ${review.content}\n`;
        if (review.helpful) md += `- ${review.helpful}\n`;
        md += '\n';
      });
    }
    
    return md;
  }
  return '无数据';
}

function showLoadingOverlay(text = '正在处理...') {
  const overlay = document.getElementById('loadingOverlay');
  document.getElementById('loadingText').textContent = text;
  overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

async function initApp() {
  const testModeCheckbox = document.getElementById('testMode');
  isTestMode = testModeCheckbox ? testModeCheckbox.checked : false;
  
  console.log('[App] Test mode:', isTestMode);
  
  if (isTestMode) {
    console.log('[App] Running in TEST MODE - Appwrite disabled');
    await loadTestModeData();
    updateUIForLoggedIn();
  } else {
    try {
      appwrite = await getAppwriteClient();
      
      const isLoggedIn = await appwrite.loadSession();
      
      if (isLoggedIn && appwrite.user) {
        updateUIForLoggedIn();
      } else {
        updateUIForLoggedOut();
      }
      
      await loadProductData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      updateUIForLoggedOut();
    }
  }
}

function updateUIForLoggedIn() {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('contentContainer').classList.remove('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  
  if (appwrite && appwrite.user) {
    document.getElementById('userName').textContent = appwrite.user.name || appwrite.user.email;
  }
  
  if (!isTestMode) {
    document.getElementById('userName').textContent += ' (测试模式)' : '';
  }
  
  document.getElementById('userInfo').classList.remove('hidden');
}

function updateUIForLoggedOut() {
  document.getElementById('authContainer').classList.remove('hidden');
  document.getElementById('contentContainer').classList.add('hidden');
  document.getElementById('userInfo').classList.add('hidden');
}

async function loadProductData() {
  const result = await chrome.storage.local.get(['productData', 'currentTabUrl']);
  currentProductData = result.productData;  
  if (currentProductData) {
    render(currentProductData);
  } else {
    await fetchNewData();
  }
}

async function fetchNewData() {
  showLoading('正在获取商品数据...');
  
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        currentProductData = null;
        await chrome.runtime.sendMessage({ action: 'fetchData' });
      }
    });
  } catch (error) {
    console.error('Failed to fetch data:', error);
    showToast('获取数据失败', 'error');
    showLoading('请刷新页面');
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showToast('请填写邮箱和密码', 'error');
    return;
  }
  
  showLoadingOverlay('正在登录...');
  
  try {
    await appwrite.createEmailSession(email, password);
    showToast('登录成功', 'success');
    updateUIForLoggedIn();
    loadSavedDocuments();
  } catch (error) {
    console.error('Login failed:', error);
    showToast(error.message || '登录失败，请检查邮箱和密码', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleRegister() {
  const name = document.getElementById('registerName').value.trim() || '';
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  
  if (!name || !email || !password) {
    showToast('请填写所有字段', 'error');
    return;
  }
  
  if (password.length < 8) {
    showToast('密码至少需要8位', 'error');
    return;
  }
  
  showLoadingOverlay('正在注册...');
  
  try {
    await appwrite.createAccount(email, password, name);
    showToast('注册成功', 'success');
    updateUIForLoggedIn();
    loadSavedDocuments();
  } catch (error) {
    console.error('Registration failed:', error);
    showToast(error.message || '注册失败，请重试', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleLogout() {
  if (!confirm('确定要退出登录吗？')) return;
  
  showLoadingOverlay('正在退出...');
  
  try {
    await appwrite.deleteSession();
    showToast('已退出登录', 'info');
    updateUIForLoggedOut();
  } catch (error) {
    console.error('Logout failed:', error);
    showToast('退出失败', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function loadSavedDocuments() {
  if (isTestMode) {
    savedDocuments = await getTestModeMarkdowns();
    filteredDocuments = [...savedDocuments];
    renderSavedList();
    return;
  }
  
  if (!appwrite || !appwrite.user) return;
  
  try {
    savedDocuments = await appwrite.getUserMarkdowns();
    filteredDocuments = [...savedDocuments];
    renderSavedList();
  } catch (error) {
    console.error('Failed to load saved documents:', error);
    showToast('加载已保存文档失败', 'error');
  }
}

function filterSavedDocuments(query) {
  if (!query) {
    filteredDocuments = [...savedDocuments];
  } else {
    const lowerQuery = query.toLowerCase();
    if (isTestMode) {
      filteredDocuments = savedDocuments.filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.asin.toLowerCase().includes(lowerQuery)
      );
    } else {
      filteredDocuments = savedDocuments.filter(doc => 
        doc.title && (doc.title.toLowerCase().includes(lowerQuery) ||
        (doc.asin && doc.asin.toLowerCase().includes(lowerQuery)))
      );
    }
  }
  renderSavedList();
}

async function handleSaveToCloud() {
  if (!currentProductData) {
    showToast('请先获取商品数据', 'error');
    return;
  }
  
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;
  
  if (!url) {
    showToast('无法获取当前页面URL', 'error');
    return;
  }
  
  const asin = getAsinFromUrl(url);
  
  if (!asin) {
    showToast('无法从URL提取ASIN', 'error');
    return;
  }
  
  showLoadingOverlay('正在保存到云端...');
  
  try {
    const title = currentProductData.type === 'detail' 
      ? currentProductData.item.title 
      : `商品列表_${new Date().toLocaleDateString()}`;
    
    const content = toMarkdown(currentProductData);
    const images = currentProductData.type === 'detail' 
      ? (currentProductData.item.images || []).map(img => img.url)
      : [];
    
    if (isTestMode) {
      await saveTestModeMarkdown(asin, title, content, url, images);
      showToast('保存成功（测试模式）', 'success');
    } else {
      await appwrite.saveMarkdown(asin, title, content, url, images);
      showToast('保存成功', 'success');
    }
    
    await loadSavedDocuments();
  } catch (error) {
    console.error('Failed to save to cloud:', error);
    showToast(error.message || '保存失败，请重试', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleDownloadFromCloud(documentId) {
  try {
    let content;
    
    if (isTestMode) {
      const docs = await getTestModeMarkdowns();
      const doc = docs.find(d => d.asin === documentId || d.$id === documentId);
      if (doc) {
        content = doc.content;
        showToast('下载成功（测试模式）', 'success');
      } else {
        showToast('文档不存在', 'error');
        return;
      }
    } else {
      const doc = await appwrite.getDocument(documentId);
      content = doc.content;
      showToast('下载成功', 'success');
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isTestMode ? `test_${documentId}.md` : `${documentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download:', error);
    showToast('下载失败', 'error');
  }
}

async function handleDeleteFromCloud(documentId) {
  if (!confirm('确定要删除这个文档吗？')) return;
  
  try {
    if (isTestMode) {
      await deleteTestModeMarkdown(documentId);
      showToast('删除成功（测试模式）', 'success');
    } else {
      await appwrite.deleteMarkdown(documentId);
      showToast('删除成功', 'success');
    }
    
    await loadSavedDocuments();
  } catch (error) {
    console.error('Failed to delete:', error);
    showToast('删除失败', 'error');
  }
}

async function handleDownload() {
  chrome.storage.local.get(['productData'], (result) => {
    const data = result.productData;
    if (!data || (data.type === 'list' && !data.items?.length) || (data.type === 'detail' && !data.item?.title)) {
      alert('没有可导出的数据');
      return;
    }
    
    const md = toMarkdown(data);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `商品信息_${timestamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function handleTabSwitch(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Form`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

document.getElementById('loginBtn').onclick = handleLogin;
document.getElementById('registerBtn').onclick = handleRegister;
document.getElementById('logoutBtn').onclick = handleLogout;

document.getElementById('refreshBtn').onclick = fetchNewData;
document.getElementById('downloadBtn').onclick = handleDownload;
document.getElementById('saveBtn').onclick = handleSaveToCloud;

document.getElementById('searchInput').oninput = (e) => {
  filterSavedDocuments(e.target.value);
};

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => handleTabSwitch(btn.dataset.tab);
});

document.getElementById('savedList').onclick = (e) => {
  if (e.target.classList.contains('download-icon-btn')) {
    handleDownloadFromCloud(e.target.dataset.id);
  } else if (e.target.classList.contains('delete-icon-btn')) {
    handleDeleteFromCloud(e.target.dataset.id);
  }
};

chrome.storage.onChanged.addListener((changes) => {
  if (changes.productData) {
    currentProductData = changes.productData.newValue;
    if (currentProductData) {
      render(currentProductData);
    }
  }
});

document.getElementById('testMode').onchange = async () => {
  isTestMode = document.getElementById('testMode').checked;
  console.log('[App] Test mode changed:', isTestMode);
  
  if (isTestMode) {
    console.log('[App] Switching to TEST MODE');
    await loadTestModeData();
  } else {
    console.log('[App] Switching to NORMAL MODE');
    const testDocs = await chrome.storage.local.get(['testModeSavedDocs']);
    if (testDocs.testModeSavedDocs && testDocs.testModeSavedDocs.length > 0) {
      console.log('[App] Warning: Switching to normal mode with test data');
    }
    await loadProductData();
  }
};
