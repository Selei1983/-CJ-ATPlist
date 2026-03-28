function isListPage() {
  return document.querySelectorAll('[data-component-type="s-search-result"]').length > 0;
}

function isDetailPage() {
  return !!document.getElementById('productTitle');
}

function getListData() {
  const items = [];
  document.querySelectorAll('[data-component-type="s-search-result"]').forEach(el => {
    const title = el.querySelector('h2 a span')?.innerText?.trim() || '';
    const link = el.querySelector('h2 a')?.getAttribute('href') || '';
    const fullLink = link.startsWith('http') ? link : 'https://www.amazon.com' + link;
    const img = el.querySelector('img')?.src || '';
    const price = el.querySelector('.a-price .a-offscreen')?.innerText || '';
    if (title) {
      items.push({ title, link: fullLink, img, price });
    }
  });
  return items;
}

function getDetailImages() {
  const images = [];
  
  const mainImage = document.getElementById('landingImage')?.src;
  if (mainImage) {
    images.push({ type: 'main', url: mainImage });
  }
  
  const altImagesContainer = document.getElementById('altImages');
  if (altImagesContainer) {
    altImagesContainer.querySelectorAll('img').forEach(img => {
      const url = img.getAttribute('src') || img.getAttribute('data-src');
      if (url) {
        images.push({ type: 'thumbnail', url });
      }
    });
  }
  
  const galleryImages = document.querySelectorAll('.a-spacing-small .itemNo0 img');
  galleryImages.forEach(img => {
    const url = img.getAttribute('src') || img.getAttribute('data-src');
    if (url && !images.find(i => i.url === url)) {
      images.push({ type: 'gallery', url });
    }
  });
  
  const variationImages = document.querySelectorAll('.variation-value-image');
  variationImages.forEach(img => {
    const url = img.getAttribute('src') || img.getAttribute('data-src');
    if (url && !images.find(i => i.url === url)) {
      images.push({ type: 'variation', url });
    }
  });
  
  return images;
}

function getDetailVideos() {
  const videos = [];
  
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    const url = video.querySelector('source')?.src || video.src;
    if (url) {
      videos.push({ url });
    }
  });
  
  const videoLinks = document.querySelectorAll('[data-video-url]');
  videoLinks.forEach(link => {
    const url = link.getAttribute('data-video-url');
    if (url && !videos.find(v => v.url === url)) {
      videos.push({ url });
    }
  });
  
  const videoThumbnails = document.querySelectorAll('.video-instructions-container img, .adbl-video-wrapper img');
  videoThumbnails.forEach(img => {
    const url = img.getAttribute('src') || img.getAttribute('data-src');
    if (url && !videos.find(v => v.url === url)) {
      videos.push({ url, thumbnail: true });
    }
  });
  
  return videos;
}

function getDetailReviews() {
  const reviews = [];
  
  const reviewElements = document.querySelectorAll('[data-hook="review"]');
  reviewElements.forEach(review => {
    const reviewer = review.querySelector('[data-hook="review-author"]')?.innerText?.trim() || '';
    const rating = review.querySelector('[data-hook="review-star-rating"]')?.innerText?.trim() || 
                  review.querySelector('.a-icon-alt')?.innerText?.trim() || '';
    const title = review.querySelector('[data-hook="review-title"] span')?.innerText?.trim() || '';
    const date = review.querySelector('[data-hook="review-date"]')?.innerText?.trim() || '';
    const verified = review.querySelector('[data-hook="avp-badge"]') ? 'Verified Purchase' : '';
    const content = review.querySelector('[data-hook="review-body"] span')?.innerText?.trim() || '';
    const helpful = review.querySelector('[data-hook="helpful-vote-statement"]')?.innerText?.trim() || '';
    
    if (content || title) {
      reviews.push({ reviewer, rating, title, date, verified, content, helpful });
    }
  });
  
  return reviews;
}

function getProductDetails() {
  const details = [];
  
  const detailSections = [
    { selector: '#productDetails_techSpec_section_1', title: '技术规格' },
    { selector: '#productDetails_feature_div', title: '产品详情' },
    { selector: '.prodDetTable', title: '产品详情' },
    { selector: '#detailBullets_feature_div', title: '详细信息' },
    { selector: '#productDetails_db_sections', title: '产品详情' }
  ];
  
  detailSections.forEach(section => {
    const container = document.querySelector(section.selector);
    if (container) {
      const tables = container.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const labelCell = row.querySelector('th');
          const valueCell = row.querySelector('td');
          if (labelCell && valueCell) {
            const label = labelCell.innerText?.trim();
            const value = valueCell.innerText?.trim();
            if (label && value) {
              details.push({ label, value, section: section.title });
            }
          }
        });
      });
    }
  });
  
  const keyValueTables = document.querySelectorAll('table.a-keyvalue, table.prodDetTable');
  keyValueTables.forEach(table => {
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const labelCell = row.querySelector('th');
      const valueCell = row.querySelector('td');
      if (labelCell && valueCell) {
        const label = labelCell.innerText?.trim();
        const value = valueCell.innerText?.trim();
        if (label && value) {
          const exists = details.find(d => d.label === label && d.value === value);
          if (!exists) {
            details.push({ label, value, section: '产品信息' });
          }
        }
      }
    });
  });
  
  const detailListItems = document.querySelectorAll('#detailBullets_feature_div ul li, .a-spacing-small.pdTab ul li');
  detailListItems.forEach(li => {
    const text = li.innerText?.trim();
    if (text && !details.find(d => d.value === text)) {
      const parts = text.split(/[:：]/);
      if (parts.length >= 2) {
        const label = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        details.push({ label, value, section: '详细信息' });
      } else {
        details.push({ label: '信息', value: text, section: '详细信息' });
      }
    }
  });
  
  return details;
}

function getDetailData() {
  const title = document.getElementById('productTitle')?.innerText?.trim() || '';
  const price = document.querySelector('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen')?.innerText ||
    document.querySelector('#priceblock_ourprice')?.innerText || '';
  const bulletPoints = Array.from(document.querySelectorAll('#feature-bullets ul li span'))
    .map(e => e.innerText?.trim())
    .filter(Boolean);
  
  const images = getDetailImages();
  const videos = getDetailVideos();
  const reviews = getDetailReviews();
  const productDetails = getProductDetails();
  
  return {
    title,
    price,
    bulletPoints,
    images,
    videos,
    reviews,
    productDetails
  };
}

function collectPageData() {
  try {
    if (isListPage()) {
      const items = getListData();
      if (items.length > 0) {
        return { type: 'list', items };
      }
    } else if (isDetailPage()) {
      const item = getDetailData();
      if (item.title) {
        return { type: 'detail', item };
      }
    }
    return { type: 'unknown' };
  } catch (error) {
    console.error('Error collecting page data:', error);
    return { type: 'error', message: error.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collectData') {
    const data = collectPageData();
    chrome.runtime.sendMessage({ action: 'dataCollected', data });
    sendResponse({ success: true });
  }
  return true;
});
