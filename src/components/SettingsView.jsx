import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, ExternalLink } from 'lucide-react'
import { getApiKeys, saveApiKeys, getSettings, saveSettings } from '../services/storage'
import { AVAILABLE_MODELS } from '../services/aiService'

export default function SettingsView() {
  const [apiKeys, setApiKeys] = useState(getApiKeys())
  const [settings, setSettings] = useState(getSettings())
  const [showKeys, setShowKeys] = useState({})
  const [saved, setSaved] = useState(false)
  
  const handleApiKeyChange = (modelId, value) => {
    const newKeys = { ...apiKeys, [modelId]: value }
    setApiKeys(newKeys)
    saveApiKeys(newKeys)
    showSavedFeedback()
  }
  
  const showSavedFeedback = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const toggleShowKey = (modelId) => {
    setShowKeys(prev => ({ ...prev, [modelId]: !prev[modelId] }))
  }
  
  const apiKeyLinks = {
    claude: 'https://console.anthropic.com/settings/keys',
    gpt: 'https://platform.openai.com/api-keys',
    gemini: 'https://aistudio.google.com/app/apikey',
    llama: 'https://console.groq.com/keys'
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚙️ Asetukset</h1>
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            Tallennettu
          </span>
        )}
      </div>
      
      {/* API Keys */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-medium text-lg mb-4">🔑 API-avaimet</h2>
        <p className="text-sm text-gray-500 mb-6">
          Syötä API-avaimet mallien käyttämiseksi. Avaimet tallennetaan vain selaimesi muistiin.
        </p>
        
        <div className="space-y-4">
          {AVAILABLE_MODELS.map(model => (
            <div key={model.id}>
              <div className="flex items-center justify-between mb-1">
                <label className={`font-medium ${model.color}`}>
                  {model.name}
                </label>
                <a
                  href={apiKeyLinks[model.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Hanki avain <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="relative">
                <input
                  type={showKeys[model.id] ? 'text' : 'password'}
                  value={apiKeys[model.id] || ''}
                  onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                  placeholder={`${model.name} API-avain`}
                  className="w-full px-3 py-2 pr-10 border rounded-lg text-sm font-mono"
                />
                <button
                  onClick={() => toggleShowKey(model.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[model.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {apiKeys[model.id] && (
                <p className="text-xs text-green-600 mt-1">✓ Avain asetettu</p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Tietoa sovelluksesta</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            AI Brand Research on työkalu brändien näkyvyyden tutkimiseen tekoälymalleissa.
          </p>
          <p>
            <strong>Yksityisyys:</strong> Kaikki tiedot tallennetaan vain selaimesi 
            paikalliseen muistiin (localStorage). Emme lähetä tietojasi minnekään.
          </p>
          <p>
            <strong>API-kutsut:</strong> Kyselyt lähetetään suoraan tekoälypalveluiden 
            API:hin selaimestasi. Käytä omia API-avaimiasi.
          </p>
        </div>
      </div>
      
      {/* Usage tips */}
      <div className="bg-yellow-50 rounded-xl p-6">
        <h3 className="font-medium text-yellow-900 mb-2">💡 Käyttövinkit</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Aloita ilmaisilla API-avaimilla (Gemini, Groq)</li>
          <li>• Claude ja GPT vaativat maksullisen tilin</li>
          <li>• Vie tietosi säännöllisesti varmuuskopioksi</li>
          <li>• Käytä johdonmukaisia kysymyksiä vertailukelpoisiin tuloksiin</li>
        </ul>
      </div>
    </div>
  )
}
