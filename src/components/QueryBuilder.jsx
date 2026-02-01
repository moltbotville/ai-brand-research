import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Plus, X, Loader2, Save, Clock } from 'lucide-react'
import { queryModels, AVAILABLE_MODELS } from '../services/aiService'
import { saveQuery, getApiKeys } from '../services/storage'

export default function QueryBuilder() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState(['claude', 'gpt', 'gemini'])
  const [brands, setBrands] = useState([''])
  const [questionType, setQuestionType] = useState('open') // 'open' or 'choice'
  const [choices, setChoices] = useState(['', '', '', ''])
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [schedule, setSchedule] = useState(null)
  
  const apiKeys = getApiKeys()
  const hasAnyApiKey = Object.values(apiKeys).some(key => key)
  
  const toggleModel = (model) => {
    setSelectedModels(prev => 
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }
  
  const addBrand = () => {
    setBrands([...brands, ''])
  }
  
  const removeBrand = (index) => {
    setBrands(brands.filter((_, i) => i !== index))
  }
  
  const updateBrand = (index, value) => {
    const newBrands = [...brands]
    newBrands[index] = value
    setBrands(newBrands)
  }
  
  const runQuery = async () => {
    if (!prompt.trim()) {
      setError('Anna kysymys')
      return
    }
    
    if (selectedModels.length === 0) {
      setError('Valitse vähintään yksi malli')
      return
    }
    
    if (!hasAnyApiKey) {
      setError('Lisää API-avaimet asetuksista')
      return
    }
    
    setIsRunning(true)
    setError(null)
    setResults(null)
    
    try {
      const fullPrompt = questionType === 'choice' && choices.some(c => c.trim())
        ? `${prompt}\n\nVaihtoehdot:\n${choices.filter(c => c.trim()).map((c, i) => `${i + 1}. ${c}`).join('\n')}`
        : prompt
      
      const queryResults = await queryModels(fullPrompt, selectedModels, apiKeys)
      
      // Save to history
      const queryData = {
        id: Date.now().toString(),
        prompt: fullPrompt,
        originalPrompt: prompt,
        questionType,
        choices: choices.filter(c => c.trim()),
        brands: brands.filter(b => b.trim()),
        models: selectedModels,
        results: queryResults,
        timestamp: new Date().toISOString()
      }
      
      saveQuery(queryData)
      setResults(queryResults)
      
      // Navigate to results
      navigate(`/results/${queryData.id}`)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRunning(false)
    }
  }
  
  const exampleQueries = [
    'Mitä pyykinpesuainetta suosittelet?',
    'Mikä on paras sähköauto?',
    'Suosittele hyvää kahvimerkiä',
    'Mikä on luotettavin pankkipalvelu?',
    'Mitä puhelinta suosittelet?'
  ]
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Uusi brändikysely</h1>
        
        {/* Prompt input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kysymys
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Esim: Mitä pyykinpesuainetta suosittelet?"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          />
          
          {/* Example queries */}
          <div className="mt-2 flex flex-wrap gap-2">
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => setPrompt(q)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        
        {/* Question type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kysymystyyppi
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={questionType === 'open'}
                onChange={() => setQuestionType('open')}
                className="text-blue-600"
              />
              <span>Avoin kysymys</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={questionType === 'choice'}
                onChange={() => setQuestionType('choice')}
                className="text-blue-600"
              />
              <span>Monivalinta</span>
            </label>
          </div>
          
          {/* Choices for multiple choice */}
          {questionType === 'choice' && (
            <div className="mt-4 space-y-2">
              {choices.map((choice, i) => (
                <input
                  key={i}
                  type="text"
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...choices]
                    newChoices[i] = e.target.value
                    setChoices(newChoices)
                  }}
                  placeholder={`Vaihtoehto ${i + 1}`}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Brand tracking */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seurattavat brändit (valinnainen)
          </label>
          <div className="space-y-2">
            {brands.map((brand, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => updateBrand(i, e.target.value)}
                  placeholder="Brändin nimi"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                {brands.length > 1 && (
                  <button
                    onClick={() => removeBrand(i)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addBrand}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" /> Lisää brändi
            </button>
          </div>
        </div>
        
        {/* Model selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI-mallit
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                disabled={!apiKeys[model.id]}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedModels.includes(model.id)
                    ? `${model.color} border-current`
                    : 'border-gray-200 text-gray-400'
                } ${!apiKeys[model.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
              >
                {model.name}
                {!apiKeys[model.id] && ' (ei avainta)'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Run button */}
        <div className="flex gap-3">
          <button
            onClick={runQuery}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kysytään malleilta...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Suorita kysely
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Quick tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Vinkkejä</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Käytä suomenkielisiä kysymyksiä saadaksesi suomenkielisiä vastauksia</li>
          <li>• Lisää seurattavat brändit, jotta näet ne korostettuna vastauksissa</li>
          <li>• Vertaa samaa kysymystä eri malleilla nähdäksesi eroja</li>
          <li>• Ajasta kyselyitä seurataksesi brändinäkyvyyden kehitystä</li>
        </ul>
      </div>
    </div>
  )
}
