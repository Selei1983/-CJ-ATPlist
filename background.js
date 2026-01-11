chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('amazon.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'collectData' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to send message:', chrome.runtime.lastError);
            chrome.storage.local.set({ productData: { type: 'error', message: '无法连接到页面，请刷新后重试' } });
          }
        });
      } else {
        chrome.storage.local.set({ productData: { type: 'error', message: '请在 Amazon 商品页面使用此扩展' } });
      }
    });
    return true;
  }
  
  if (request.action === 'dataCollected') {
    chrome.storage.local.set({ productData: request.data }).catch((error) => {
      console.error('Failed to store data:', error);
    });
  }
});
