// Local Storage Service

const KEYS = {
  API_KEYS: 'ai-brand-research-api-keys',
  QUERIES: 'ai-brand-research-queries',
  SCHEDULED: 'ai-brand-research-scheduled',
  SETTINGS: 'ai-brand-research-settings'
}

// API Keys
export function getApiKeys() {
  const stored = localStorage.getItem(KEYS.API_KEYS)
  return stored ? JSON.parse(stored) : {
    claude: '',
    gpt: '',
    gemini: '',
    llama: ''
  }
}

export function saveApiKeys(keys) {
  localStorage.setItem(KEYS.API_KEYS, JSON.stringify(keys))
}

// Queries (History)
export function getQueries() {
  const stored = localStorage.getItem(KEYS.QUERIES)
  return stored ? JSON.parse(stored) : []
}

export function saveQuery(query) {
  const queries = getQueries()
  queries.unshift(query) // Add to beginning
  // Keep last 100 queries
  if (queries.length > 100) {
    queries.pop()
  }
  localStorage.setItem(KEYS.QUERIES, JSON.stringify(queries))
}

export function getQueryById(id) {
  const queries = getQueries()
  return queries.find(q => q.id === id)
}

export function deleteQuery(id) {
  const queries = getQueries()
  const filtered = queries.filter(q => q.id !== id)
  localStorage.setItem(KEYS.QUERIES, JSON.stringify(filtered))
}

export function clearAllQueries() {
  localStorage.setItem(KEYS.QUERIES, JSON.stringify([]))
}

// Scheduled Queries
export function getScheduledQueries() {
  const stored = localStorage.getItem(KEYS.SCHEDULED)
  return stored ? JSON.parse(stored) : []
}

export function saveScheduledQuery(scheduled) {
  const queries = getScheduledQueries()
  queries.push(scheduled)
  localStorage.setItem(KEYS.SCHEDULED, JSON.stringify(queries))
}

export function updateScheduledQuery(id, updates) {
  const queries = getScheduledQueries()
  const index = queries.findIndex(q => q.id === id)
  if (index !== -1) {
    queries[index] = { ...queries[index], ...updates }
    localStorage.setItem(KEYS.SCHEDULED, JSON.stringify(queries))
  }
}

export function deleteScheduledQuery(id) {
  const queries = getScheduledQueries()
  const filtered = queries.filter(q => q.id !== id)
  localStorage.setItem(KEYS.SCHEDULED, JSON.stringify(filtered))
}

// Settings
export function getSettings() {
  const stored = localStorage.getItem(KEYS.SETTINGS)
  return stored ? JSON.parse(stored) : {
    language: 'fi',
    defaultModels: ['claude', 'gpt', 'gemini'],
    autoHighlight: true
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// Export/Import
export function exportAllData() {
  return {
    apiKeys: getApiKeys(),
    queries: getQueries(),
    scheduled: getScheduledQueries(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  }
}

export function importData(data) {
  if (data.apiKeys) saveApiKeys(data.apiKeys)
  if (data.queries) localStorage.setItem(KEYS.QUERIES, JSON.stringify(data.queries))
  if (data.scheduled) localStorage.setItem(KEYS.SCHEDULED, JSON.stringify(data.scheduled))
  if (data.settings) saveSettings(data.settings)
}
