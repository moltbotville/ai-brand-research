import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Download, Check, Clock, AlertCircle } from 'lucide-react'
import { getQueryById } from '../services/storage'
import { AVAILABLE_MODELS, highlightBrands, extractBrandMentions } from '../services/aiService'

export default function ResultsView() {
  const { id } = useParams()
  const [query, setQuery] = useState(null)
  const [copied, setCopied] = useState(null)
  
  useEffect(() => {
    const data = getQueryById(id)
    setQuery(data)
  }, [id])
  
  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kyselyä ei löytynyt</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
          ← Takaisin
        </Link>
      </div>
    )
  }
  
  const copyToClipboard = (text, modelId) => {
    navigator.clipboard.writeText(text)
    setCopied(modelId)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const getModelInfo = (modelId) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId, color: 'text-gray-600' }
  }
  
  const getModelBorderClass = (modelId) => {
    switch (modelId) {
      case 'claude': return 'model-claude'
      case 'gpt': return 'model-gpt'
      case 'gemini': return 'model-gemini'
      case 'llama': return 'model-llama'
      default: return ''
    }
  }
  
  // Calculate brand mentions across all responses
  const brandStats = {}
  if (query.brands && query.brands.length > 0) {
    query.results.forEach(result => {
      if (result.response) {
        const mentions = extractBrandMentions(result.response, query.brands)
        Object.entries(mentions).forEach(([brand, count]) => {
          if (!brandStats[brand]) brandStats[brand] = {}
          brandStats[brand][result.modelId] = count
        })
      }
    })
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/history" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Kyselyn tulokset</h1>
          <p className="text-sm text-gray-500">
            {new Date(query.timestamp).toLocaleString('fi-FI')}
          </p>
        </div>
      </div>
      
      {/* Query info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-medium text-gray-700 mb-2">Kysymys</h2>
        <p className="text-lg">{query.originalPrompt || query.prompt}</p>
        
        {query.choices && query.choices.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Vaihtoehdot:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {query.choices.map((choice, i) => (
                <li key={i}>{choice}</li>
              ))}
            </ul>
          </div>
        )}
        
        {query.brands && query.brands.filter(b => b).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Seurattavat brändit:</h3>
            <div className="flex flex-wrap gap-2">
              {query.brands.filter(b => b).map((brand, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Brand mention summary */}
      {Object.keys(brandStats).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-gray-700 mb-4">📊 Brändimaininnat</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Brändi</th>
                  {query.results.map(r => (
                    <th key={r.modelId} className={`text-center py-2 px-3 ${getModelInfo(r.modelId).color}`}>
                      {getModelInfo(r.modelId).name}
                    </th>
                  ))}
                  <th className="text-center py-2 px-3">Yhteensä</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(brandStats).map(([brand, models]) => {
                  const total = Object.values(models).reduce((a, b) => a + b, 0)
                  return (
                    <tr key={brand} className="border-b">
                      <td className="py-2 px-3 font-medium">{brand}</td>
                      {query.results.map(r => (
                        <td key={r.modelId} className="text-center py-2 px-3">
                          {models[r.modelId] || 0}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 font-bold">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Model responses */}
      <div className="grid md:grid-cols-2 gap-4">
        {query.results.map(result => {
          const modelInfo = getModelInfo(result.modelId)
          
          return (
            <div 
              key={result.modelId}
              className={`bg-white rounded-xl shadow-sm overflow-hidden ${getModelBorderClass(result.modelId)}`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${modelInfo.color}`}>
                    {modelInfo.name}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(result.duration / 1000).toFixed(1)}s
                  </span>
                </div>
                
                {result.response && (
                  <button
                    onClick={() => copyToClipboard(result.response, result.modelId)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    title="Kopioi"
                  >
                    {copied === result.modelId ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              
              <div className="p-4">
                {result.error ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{result.error}</span>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: query.brands && query.brands.length > 0
                        ? highlightBrands(result.response, query.brands)
                        : result.response
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
