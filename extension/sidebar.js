const API_BASE = 'http://localhost:3001/api';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text, maxLength = 200) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function getImageUrl(url) {
  if (url) return url;
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="80" height="80" fill="#f5f5f5"/>' +
    '<text x="40" y="45" text-anchor="middle" fill="#999" font-size="12">无图片</text></svg>'
  );
}

function getAsinFromUrl(url) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /[?&]asin=([A-Z0-9]{10})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

let token = null;
let currentUser = null;
let currentProductData = null;
let savedProducts = [];

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

function showLoading(text) {
  document.getElementById('content').innerHTML = `<div class="loading">${text}</div>`;
  document.getElementById('downloadBtn').disabled = true;
  document.getElementById('refreshBtn').disabled = true;
  document.getElementById('saveBtn').disabled = true;
}

function showLoadingOverlay(text) {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateUIForLoggedIn() {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('contentContainer').classList.remove('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser ? (currentUser.name || currentUser.email) : '';
  loadProductData();
  loadSavedProducts();
}

function updateUIForLoggedOut() {
  document.getElementById('authContainer').classList.remove('hidden');
  document.getElementById('contentContainer').classList.add('hidden');
  document.getElementById('userInfo').classList.add('hidden');
}

async function initApp() {
  const stored = await chrome.storage.local.get(['authToken', 'authUser']);
  if (stored.authToken && stored.authUser) {
    token = stored.authToken;
    currentUser = stored.authUser;
    try {
      const data = await api('/auth/me');
      currentUser = data.user;
      await chrome.storage.local.set({ authUser: data.user });
      updateUIForLoggedIn();
    } catch {
      token = null;
      currentUser = null;
      await chrome.storage.local.remove(['authToken', 'authUser']);
      updateUIForLoggedOut();
    }
  } else {
    updateUIForLoggedOut();
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showToast('请填写邮箱和密码', 'error'); return; }

  showLoadingOverlay('正在登录...');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    token = data.token;
    currentUser = data.user;
    await chrome.storage.local.set({ authToken: token, authUser: currentUser });
    showToast('登录成功', 'success');
    updateUIForLoggedIn();
  } catch (err) {
    showToast(err.message || '登录失败', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleRegister() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (!name || !email || !password) { showToast('请填写所有字段', 'error'); return; }
  if (password.length < 6) { showToast('密码至少需要6位', 'error'); return; }

  showLoadingOverlay('正在注册...');
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    token = data.token;
    currentUser = data.user;
    await chrome.storage.local.set({ authToken: token, authUser: currentUser });
    showToast('注册成功', 'success');
    updateUIForLoggedIn();
  } catch (err) {
    showToast(err.message || '注册失败', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleLogout() {
  if (!confirm('确定要退出登录吗？')) return;
  token = null;
  currentUser = null;
  currentProductData = null;
  savedProducts = [];
  await chrome.storage.local.remove(['authToken', 'authUser', 'productData']);
  showToast('已退出登录', 'info');
  updateUIForLoggedOut();
}

async function loadProductData() {
  const result = await chrome.storage.local.get(['productData']);
  currentProductData = result.productData;
  if (currentProductData) {
    render(currentProductData);
  } else {
    fetchNewData();
  }
}

async function fetchNewData() {
  showLoading('正在获取商品数据...');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentProductData = null;
      chrome.runtime.sendMessage({ action: 'fetchData' });
    }
  } catch (err) {
    showToast('获取数据失败', 'error');
  }
}

async function loadSavedProducts() {
  if (!token) return;
  try {
    const data = await api('/products?limit=50');
    savedProducts = data.products || [];
    renderSavedList();
  } catch (err) {
    console.error('Failed to load saved products:', err);
  }
}

function filterSavedProducts(query) {
  if (!query) return savedProducts;
  const q = query.toLowerCase();
  return savedProducts.filter(p =>
    (p.title || '').toLowerCase().includes(q) || (p.asin || '').toLowerCase().includes(q)
  );
}

async function handleSaveToBackend() {
  if (!currentProductData) { showToast('请先获取商品数据', 'error'); return; }
  if (!token) { showToast('请先登录', 'error'); return; }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;
  if (!url) { showToast('无法获取当前页面URL', 'error'); return; }

  const asin = getAsinFromUrl(url);
  if (!asin) { showToast('无法从URL提取ASIN', 'error'); return; }

  showLoadingOverlay('正在保存到服务器...');

  try {
    if (currentProductData.type === 'detail') {
      const item = currentProductData.item;
      const productData = {
        asin,
        title: item.title,
        price: item.price || null,
        description: (item.bulletPoints || []).join('\n'),
        bulletPoints: item.bulletPoints || [],
        images: (item.images || []).map(img => img.url),
        videos: (item.videos || []).map(v => v.url),
        details: item.productDetails || [],
        reviews: (item.reviews || []).map(r => ({
          reviewer: r.reviewer, rating: r.rating, title: r.title,
          date: r.date, verified: r.verified, content: r.content, helpful: r.helpful
        })),
        url,
        category: null,
        tags: []
      };
      await api('/products', { method: 'POST', body: JSON.stringify(productData) });
    } else if (currentProductData.type === 'list') {
      for (const item of currentProductData.items) {
        const itemAsin = getAsinFromUrl(item.link);
        if (!itemAsin) continue;
        await api('/products', {
          method: 'POST',
          body: JSON.stringify({
            asin: itemAsin,
            title: item.title,
            price: item.price || null,
            images: item.img ? [item.img] : [],
            url: item.link,
          })
        });
      }
    } else {
      throw new Error('无可保存的数据');
    }

    showToast('保存成功！', 'success');
    await loadSavedProducts();
  } catch (err) {
    showToast(err.message || '保存失败', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('确定要删除这个商品吗？')) return;
  try {
    await api(`/products/${id}`, { method: 'DELETE' });
    showToast('删除成功', 'success');
    await loadSavedProducts();
  } catch (err) {
    showToast('删除失败', 'error');
  }
}

function render(data) {
  const content = document.getElementById('content');

  if (data.type === 'error') {
    content.innerHTML = `<div class="error">错误: ${escapeHtml(data.message)}</div>`;
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('saveBtn').disabled = true;
    return;
  }

  if (data.type === 'unknown') {
    content.innerHTML = '<div class="empty-state">未识别页面类型。请在 Amazon 商品页面使用。</div>';
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('saveBtn').disabled = true;
    return;
  }

  if (data.type === 'list') {
    if (!data.items || data.items.length === 0) {
      content.innerHTML = '<div class="empty-state">未找到商品信息</div>';
      document.getElementById('downloadBtn').disabled = true;
      document.getElementById('saveBtn').disabled = true;
      document.getElementById('refreshBtn').disabled = false;
      return;
    }
    content.innerHTML = data.items.map(item => {
      const displayTitle = escapeHtml(truncateText(item.title, 150));
      return `<div class="product-item">
        <img src="${getImageUrl(item.img)}" width="80" height="80" alt="${displayTitle}" />
        <div class="product-info">
          <a href="${escapeHtml(item.link)}" target="_blank">${displayTitle}</a>
          <div class="price">${escapeHtml(item.price)}</div>
        </div>
      </div>`;
    }).join('<hr class="divider">');
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('refreshBtn').disabled = false;
    document.getElementById('saveBtn').disabled = !token;
    return;
  }

  if (data.type === 'detail') {
    const item = data.item;
    const displayTitle = escapeHtml(truncateText(item.title, 200));
    let html = `<div class="product-detail"><h3>${displayTitle}</h3><div class="price">${escapeHtml(item.price)}</div>`;

    if (item.images && item.images.length > 0) {
      html += `<div class="section"><strong>商品图片 (${item.images.length}):</strong><div class="image-gallery">`;
      item.images.forEach(img => {
        const label = img.type === 'main' ? '主图' : img.type;
        html += `<div class="image-item">
          <img src="${getImageUrl(img.url)}" width="60" height="60" alt="${escapeHtml(label)}" />
          <span class="image-label">${escapeHtml(label)}</span>
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
        html += `<div class="detail-row"><span class="detail-label">${escapeHtml(detail.label)}</span><span class="detail-value">${escapeHtml(detail.value)}</span></div>`;
      });
      html += `</div></div>`;
    }

    if (item.reviews && item.reviews.length > 0) {
      html += `<div class="section"><strong>买家评论 (${item.reviews.length}):</strong><div class="reviews">`;
      item.reviews.forEach(review => {
        html += `<div class="review-item">
          <div class="review-header"><strong>${escapeHtml(review.reviewer || '匿名用户')}</strong><span class="rating">${escapeHtml(review.rating)}</span></div>
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
    document.getElementById('saveBtn').disabled = !token;
    return;
  }
}

function renderSavedList(query) {
  const list = document.getElementById('savedList');
  const filtered = query ? filterSavedProducts(query) : savedProducts;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无已保存商品</div>';
    return;
  }

  list.innerHTML = filtered.map(p => `<div class="saved-item">
    <div class="saved-item-info">
      <div class="saved-item-title">${escapeHtml(truncateText(p.title, 60))}</div>
      <div class="saved-item-asin">${escapeHtml(p.asin || '')} · ${escapeHtml(p.price || '')}</div>
    </div>
    <div class="saved-item-actions">
      <button class="action-icon-btn delete-icon-btn" data-id="${p.id}">删除</button>
    </div>
  </div>`).join('');
}

function toMarkdown(data) {
  if (data.type === 'list') {
    return data.items.map(item =>
      `![商品图片](${item.img})\n[${item.title}](${item.link})\n价格: ${item.price}\n`
    ).join('\n---\n');
  } else if (data.type === 'detail') {
    const item = data.item;
    let md = `# ${item.title}\n价格: ${item.price}\n\n## 核心卖点\n${(item.bulletPoints || []).map(p => `- ${p}`).join('\n')}\n`;
    if (item.productDetails && item.productDetails.length > 0) {
      md += '\n## 商品信息\n\n';
      item.productDetails.forEach(d => { md += `- **${d.label}**: ${d.value}\n`; });
    }
    if (item.images && item.images.length > 0) {
      md += '\n## 商品图片\n';
      item.images.forEach((img, i) => { md += `![${img.type === 'main' ? '主图' : img.type + ' ' + i}](${img.url})\n`; });
    }
    if (item.videos && item.videos.length > 0) {
      md += '\n## 商品视频\n';
      item.videos.forEach((v, i) => { md += `- [视频${i + 1}](${v.url})\n`; });
    }
    if (item.reviews && item.reviews.length > 0) {
      md += '\n## 买家评论\n\n';
      item.reviews.forEach((r, i) => {
        md += `### 评论 ${i + 1}\n`;
        if (r.reviewer) md += `- 评论者: ${r.reviewer}\n`;
        if (r.rating) md += `- 评分: ${r.rating}\n`;
        if (r.title) md += `- 标题: ${r.title}\n`;
        if (r.date) md += `- 日期: ${r.date}\n`;
        if (r.verified) md += `- ${r.verified}\n`;
        md += `- 内容: ${r.content}\n`;
        if (r.helpful) md += `- ${r.helpful}\n`;
        md += '\n';
      });
    }
    return md;
  }
  return '无数据';
}

function handleDownload() {
  chrome.storage.local.get(['productData'], (result) => {
    const data = result.productData;
    if (!data) { alert('没有可导出的数据'); return; }
    const md = toMarkdown(data);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `商品信息_${ts}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function handleTabSwitch(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Form`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => initApp());

document.getElementById('loginBtn').onclick = handleLogin;
document.getElementById('registerBtn').onclick = handleRegister;
document.getElementById('logoutBtn').onclick = handleLogout;

document.getElementById('refreshBtn').onclick = fetchNewData;
document.getElementById('downloadBtn').onclick = handleDownload;
document.getElementById('saveBtn').onclick = handleSaveToBackend;

document.getElementById('searchInput').oninput = (e) => renderSavedList(e.target.value);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => handleTabSwitch(btn.dataset.tab);
});

document.getElementById('savedList').onclick = (e) => {
  const btn = e.target.closest('.delete-icon-btn');
  if (btn) handleDeleteProduct(btn.dataset.id);
};

chrome.storage.onChanged.addListener((changes) => {
  if (changes.productData) {
    currentProductData = changes.productData.newValue;
    if (currentProductData) render(currentProductData);
  }
});
