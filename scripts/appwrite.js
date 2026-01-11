class AppwriteClient {
  constructor() {
    this.endpoint = "https://appwrite.shumitech.com/v1";
    this.projectId = "6963a6d10023ddbd0b80";
    this.apiKey = "standard_b1e50575abbea876f3e1089e9fe9d78a1743e30ff4625c4f251488ade418f54f8a3202fb5fbe02bd7f3e3fbf8432ef6c996e63a89f8b02bad111b9582866eda2a389da50e52acf2271366bda124bec8feafbd66c050b5825c728137d04d62276dff4c986131d89a5da94960e0c79538f2767fcf514a780d85119bf4e2023f251";
    this.databaseId = "default";
    this.collectionId = "markdowns";
    this.session = null;
    this.user = null;
  }

  async request(method, path, data = null, headers = {}) {
    const url = `${this.endpoint}${path}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': this.projectId,
      'Accept': 'application/json',
      'User-Agent': 'AmazonProductExporter/2.0'
    };

    if (this.session) {
      defaultHeaders['X-Appwrite-Session'] = this.session;
    }

    const options = {
      method: method,
      headers: { ...defaultHeaders, ...headers }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`[Appwrite] ${method} ${url}`);
    console.log('[Appwrite] Data:', data);

    try {
      const response = await fetch(url, options);
      const text = await response.text();
      console.log(`[Appwrite] Response status: ${response.status}`);
      console.log('[Appwrite] Response body:', text);
      
      const result = JSON.parse(text);

      if (!response.ok) {
        const errorMsg = result.message || result.code || `Request failed: ${response.status}`;
        console.error('[Appwrite] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      return result;
    } catch (error) {
      console.error('[Appwrite] Request failed:', error);
      throw error;
    }
  }

  async createAccount(email, password, name) {
    console.log('[Appwrite] Creating account for:', email);
    
    const result = await this.request('POST', '/account', {
      email,
      password,
      name
    });
    
    this.session = result.$id;
    this.user = result;
    await this.saveSession();
    console.log('[Appwrite] Account created successfully');
    return result;
  }

  async createEmailSession(email, password) {
    console.log('[Appwrite] Creating session for:', email);
    
    const result = await this.request('POST', '/account/sessions/email', {
      email,
      password
    });
    
    this.session = result.$id;
    this.user = result;
    await this.saveSession();
    console.log('[Appwrite] Session created successfully');
    return result;
  }

  async getAccount() {
    try {
      const result = await this.request('GET', '/account');
      this.user = result;
      return result;
    } catch (error) {
      if (error.message.includes('401')) {
        await this.clearSession();
      }
      throw error;
    }
  }

  async deleteSession(sessionId = 'current') {
    const id = sessionId === 'current' ? this.session : sessionId;
    await this.request('DELETE', `/account/sessions/${id}`);
    await this.clearSession();
  }

  async saveSession() {
    if (this.session) {
      await chrome.storage.local.set({
        appwriteSession: this.session,
        appwriteUser: this.user
      });
      console.log('[Appwrite] Session saved');
    }
  }

  async loadSession() {
    const result = await chrome.storage.local.get(['appwriteSession', 'appwriteUser']);
    if (result.appwriteSession && result.appwriteUser) {
      this.session = result.appwriteSession;
      this.user = result.appwriteUser;
      console.log('[Appwrite] Session loaded');
      return true;
    }
    return false;
  }

  async clearSession() {
    this.session = null;
    this.user = null;
    await chrome.storage.local.remove(['appwriteSession', 'appwriteUser']);
    console.log('[Appwrite] Session cleared');
  }

  async createDocument(data) {
    const result = await this.request('POST', `/databases/${this.databaseId}/collections/${this.collectionId}/documents`, {
      ...data
    });
    return result;
  }

  async listDocuments(queries = []) {
    const queryParam = queries.length > 0 ? `?queries=${encodeURIComponent(JSON.stringify(queries))}` : '';
    const result = await this.request('GET', `/databases/${this.databaseId}/collections/${this.collectionId}/documents${queryParam}`);
    return result.documents;
  }

  async getDocument(documentId) {
    const result = await this.request('GET', `/databases/${this.databaseId}/collections/${this.collectionId}/documents/${documentId}`);
    return result;
  }

  async updateDocument(documentId, data) {
    const result = await this.request('PATCH', `/databases/${this.databaseId}/collections/${this.collectionId}/documents/${documentId}`, data);
    return result;
  }

  async deleteDocument(documentId) {
    await this.request('DELETE', `/databases/${this.databaseId}/collections/${this.collectionId}/documents/${documentId}`);
  }

  async saveMarkdown(asin, title, content, url, images) {
    console.log('[Appwrite] Saving markdown for ASIN:', asin);
    
    const queries = JSON.stringify([
      {
        method: 'equal',
        attribute: 'asin',
        values: [asin]
      },
      {
        method: 'equal',
        attribute: 'userId',
        values: [this.user.$id]
      }
    ]);
    
    const queryParam = `?queries=${encodeURIComponent(queries)}`;
    const existingDocs = await this.request('GET', `/databases/${this.databaseId}/collections/${this.collectionId}/documents${queryParam}`);

    if (existingDocs.documents && existingDocs.documents.length > 0) {
      const existingDoc = existingDocs.documents[0];
      console.log('[Appwrite] Updating existing document:', existingDoc.$id);
      return await this.updateDocument(existingDoc.$id, {
        title,
        content,
        url,
        images,
        userId: this.user.$id
      });
    }

    console.log('[Appwrite] Creating new document');
    return await this.createDocument({
      asin,
      title,
      content,
      url,
      images,
      userId: this.user.$id
    });
  }

  async getUserMarkdowns() {
    const queries = JSON.stringify([
      {
        method: 'equal',
        attribute: 'userId',
        values: [this.user.$id]
      }
    ]);
    
    const queryParam = `?queries=${encodeURIComponent(queries)}`;
    const result = await this.request('GET', `/databases/${this.databaseId}/collections/${this.collectionId}/documents${queryParam}`);
    return result.documents || [];
  }

  async deleteMarkdown(documentId) {
    await this.deleteDocument(documentId);
  }
}

let appwriteClient = null;

async function getAppwriteClient() {
  if (!appwriteClient) {
    appwriteClient = new AppwriteClient();
    
    try {
      await appwriteClient.loadSession();
      console.log('[Appwrite] Client initialized');
      console.log('[Appwrite] Extension ID:', chrome.runtime.id);
    } catch (error) {
      console.error('[Appwrite] Failed to initialize:', error);
    }
  }
  return appwriteClient;
}

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
