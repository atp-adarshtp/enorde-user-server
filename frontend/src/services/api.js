const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export const authService = {
  login: (username, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username, email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  getMe: (token) =>
    fetch(`${API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(res => res.json()),
};

export const apiKeyService = {
  list: () => request('/api-keys'),

  create: (name) =>
    request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  delete: (keyId) =>
    request(`/api-keys/${keyId}`, {
      method: 'POST',
    }),

  getInstallerInfo: () => request('/api-keys/installer-info'),
};

export const serversService = {
  list: () => request('/servers'),

  getMetrics: (hostname) => request(`/metrics/${hostname}`),

  getHistory: (hostname, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/metrics/${hostname}/history${query ? `?${query}` : ''}`);
  },

  getHardware: (hostname) => request(`/hardware/${hostname}`),
};

export const utils = {
  formatBytes: (bytes) => {
    if (bytes === 0 || bytes === undefined) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatUptime: (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },

  formatTimeAgo: (timestamp) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((Date.now() / 1000) - (timestamp / 1000000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  },

  getProgressColor: (value) => {
    if (value < 50) return 'low';
    if (value < 80) return 'medium';
    return 'high';
  },
};
