// AI Model Service - Handles API calls to different AI models

export const AVAILABLE_MODELS = [
  { id: 'claude', name: 'Claude', color: 'text-orange-600', provider: 'anthropic' },
  { id: 'gpt', name: 'GPT-4', color: 'text-green-600', provider: 'openai' },
  { id: 'gemini', name: 'Gemini', color: 'text-blue-600', provider: 'google' },
  { id: 'llama', name: 'Llama', color: 'text-purple-600', provider: 'groq' },
]

async function queryClaudeAPI(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.content[0].text
}

async function queryOpenAIAPI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

async function queryGeminiAPI(prompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

async function queryGroqAPI(prompt, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  })
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

export async function queryModel(modelId, prompt, apiKey) {
  const startTime = Date.now()
  let response = ''
  let error = null
  
  try {
    switch (modelId) {
      case 'claude':
        response = await queryClaudeAPI(prompt, apiKey)
        break
      case 'gpt':
        response = await queryOpenAIAPI(prompt, apiKey)
        break
      case 'gemini':
        response = await queryGeminiAPI(prompt, apiKey)
        break
      case 'llama':
        response = await queryGroqAPI(prompt, apiKey)
        break
      default:
        throw new Error(`Unknown model: ${modelId}`)
    }
  } catch (err) {
    error = err.message
  }
  
  const duration = Date.now() - startTime
  
  return {
    modelId,
    response,
    error,
    duration,
    timestamp: new Date().toISOString()
  }
}

export async function queryModels(prompt, modelIds, apiKeys) {
  const results = await Promise.all(
    modelIds.map(modelId => {
      const apiKey = apiKeys[modelId]
      if (!apiKey) {
        return {
          modelId,
          response: null,
          error: 'API key missing',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      }
      return queryModel(modelId, prompt, apiKey)
    })
  )
  
  return results
}

// Extract brand mentions from text
export function extractBrandMentions(text, brands) {
  const mentions = {}
  
  brands.forEach(brand => {
    if (!brand.trim()) return
    
    const regex = new RegExp(brand, 'gi')
    const matches = text.match(regex)
    mentions[brand] = matches ? matches.length : 0
  })
  
  return mentions
}

// Highlight brands in text
export function highlightBrands(text, brands) {
  let highlighted = text
  
  brands.forEach(brand => {
    if (!brand.trim()) return
    
    const regex = new RegExp(`(${brand})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark class="brand-highlight">$1</mark>')
  })
  
  return highlighted
}
