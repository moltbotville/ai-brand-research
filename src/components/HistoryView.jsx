import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Trash2, Download, Upload, Search } from 'lucide-react'
import { getQueries, deleteQuery, clearAllQueries, exportAllData, importData } from '../services/storage'
import { AVAILABLE_MODELS } from '../services/aiService'

export default function HistoryView() {
  const [queries, setQueries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  
  useEffect(() => {
    setQueries(getQueries())
  }, [])
  
  const handleDelete = (id) => {
    deleteQuery(id)
    setQueries(getQueries())
  }
  
  const handleClearAll = () => {
    clearAllQueries()
    setQueries([])
    setShowConfirmClear(false)
  }
  
  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-brand-research-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        importData(data)
        setQueries(getQueries())
        alert('Tiedot tuotu onnistuneesti!')
      } catch (err) {
        alert('Virhe tiedoston lukemisessa')
      }
    }
    reader.readAsText(file)
  }
  
  const filteredQueries = queries.filter(q => 
    q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.brands && q.brands.some(b => b.toLowerCase().includes(searchTerm.toLowerCase())))
  )
  
  const getModelInfo = (modelId) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId, color: 'text-gray-600' }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📜 Kyselyhistoria</h1>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Vie
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            Tuo
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          
          {queries.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Tyhjennä
            </button>
          )}
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Hae kyselyistä..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>
      
      {/* Query list */}
      {filteredQueries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {queries.length === 0 
            ? 'Ei vielä kyselyjä. Aloita tekemällä ensimmäinen kysely!'
            : 'Ei hakutuloksia'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map(query => (
            <div key={query.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {query.originalPrompt || query.prompt}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      {new Date(query.timestamp).toLocaleString('fi-FI')}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {query.models.map(modelId => {
                        const model = getModelInfo(modelId)
                        return (
                          <span key={modelId} className={`${model.color} text-xs`}>
                            {model.name}
                          </span>
                        )
                      })}
                    </div>
                    
                    {query.brands && query.brands.filter(b => b).length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {query.brands.filter(b => b).length} brändiä
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    to={`/results/${query.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Näytä tulokset"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(query.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Poista"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Confirm clear modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-2">Tyhjennä historia?</h3>
            <p className="text-gray-600 mb-4">
              Tämä poistaa kaikki kyselyt pysyvästi. Toimintoa ei voi peruuttaa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Peruuta
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tyhjennä
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
