class AppwriteClient {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.projectId = config.projectId;
    this.apiKey = config.apiKey;
    this.databaseId = config.databaseId;
    this.collectionId = config.collectionId;
    this.session = null;
    this.user = null;
  }

  async request(method, path, data = null, headers = {}) {
    const url = `${this.endpoint}${path}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': this.projectId
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

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Request failed: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Appwrite API Error:', error);
      throw error;
    }
  }

  async createAccount(email, password, name) {
    const result = await this.request('POST', '/account', {
      email,
      password,
      name
    });
    this.session = result.$id;
    this.user = result;
    await this.saveSession();
    return result;
  }

  async createEmailSession(email, password) {
    const result = await this.request('POST', '/account/sessions/email', {
      email,
      password
    });
    this.session = result.$id;
    this.user = result;
    await this.saveSession();
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
    }
  }

  async loadSession() {
    const result = await chrome.storage.local.get(['appwriteSession', 'appwriteUser']);
    if (result.appwriteSession && result.appwriteUser) {
      this.session = result.appwriteSession;
      this.user = result.appwriteUser;
      return true;
    }
    return false;
  }

  async clearSession() {
    this.session = null;
    this.user = null;
    await chrome.storage.local.remove(['appwriteSession', 'appwriteUser']);
  }

  async createDocument(data) {
    const result = await this.request('POST', `/databases/${this.databaseId}/collections/${this.collectionId}/documents`, {
      documentId: 'unique()',
      ...data
    });
    return result;
  }

  async listDocuments(queries = []) {
    const queryParam = queries.length > 0 ? `?queries=${encodeURIComponent(JSON.stringify(queries))}` : '';
    const result = await this.request('GET', `/databases/${this.databaseId}/collections/${this.collectionId}/documents${queryParam}`);
    return result;
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
    const existingDocs = await this.listDocuments([
      `equal("asin","${asin}")`,
      `equal("userId","${this.user.$id}")`
    ]);

    if (existingDocs.documents && existingDocs.documents.length > 0) {
      const existingDoc = existingDocs.documents[0];
      return await this.updateDocument(existingDoc.$id, {
        title,
        content,
        url,
        images,
        userId: this.user.$id
      });
    }

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
    const result = await this.listDocuments([
      `equal("userId","${this.user.$id}")`
    ]);
    return result.documents || [];
  }

  async deleteMarkdown(documentId) {
    await this.deleteDocument(documentId);
  }
}

let appwriteClient = null;

async function getAppwriteClient() {
  if (!appwriteClient) {
    try {
      const response = await fetch(chrome.runtime.getURL('config/appwrite.json'));
      const config = await response.json();
      appwriteClient = new AppwriteClient(config);
      
      await appwriteClient.loadSession();
    } catch (error) {
      console.error('Failed to load Appwrite config:', error);
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
