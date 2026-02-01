import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Play, Pause, Clock, AlertCircle } from 'lucide-react'
import { 
  getScheduledQueries, 
  saveScheduledQuery, 
  deleteScheduledQuery, 
  updateScheduledQuery,
  getApiKeys 
} from '../services/storage'
import { AVAILABLE_MODELS, queryModels } from '../services/aiService'

export default function ScheduledQueries() {
  const [scheduled, setScheduled] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newQuery, setNewQuery] = useState({
    prompt: '',
    models: ['claude', 'gpt', 'gemini'],
    brands: [''],
    interval: 'daily', // daily, weekly, monthly
    time: '09:00'
  })
  
  const apiKeys = getApiKeys()
  
  useEffect(() => {
    setScheduled(getScheduledQueries())
  }, [])
  
  const handleCreate = () => {
    const query = {
      id: Date.now().toString(),
      ...newQuery,
      brands: newQuery.brands.filter(b => b.trim()),
      enabled: true,
      lastRun: null,
      nextRun: calculateNextRun(newQuery.interval, newQuery.time),
      createdAt: new Date().toISOString()
    }
    
    saveScheduledQuery(query)
    setScheduled(getScheduledQueries())
    setShowCreate(false)
    setNewQuery({
      prompt: '',
      models: ['claude', 'gpt', 'gemini'],
      brands: [''],
      interval: 'daily',
      time: '09:00'
    })
  }
  
  const handleDelete = (id) => {
    deleteScheduledQuery(id)
    setScheduled(getScheduledQueries())
  }
  
  const toggleEnabled = (id) => {
    const query = scheduled.find(q => q.id === id)
    if (query) {
      updateScheduledQuery(id, { enabled: !query.enabled })
      setScheduled(getScheduledQueries())
    }
  }
  
  const runNow = async (id) => {
    const query = scheduled.find(q => q.id === id)
    if (!query) return
    
    // Run the query
    try {
      const results = await queryModels(query.prompt, query.models, apiKeys)
      
      // Update last run
      updateScheduledQuery(id, {
        lastRun: new Date().toISOString(),
        lastResults: results,
        nextRun: calculateNextRun(query.interval, query.time)
      })
      
      setScheduled(getScheduledQueries())
      alert('Kysely suoritettu! Tulokset tallennettu.')
    } catch (err) {
      alert('Virhe: ' + err.message)
    }
  }
  
  const intervalLabels = {
    daily: 'Päivittäin',
    weekly: 'Viikottain',
    monthly: 'Kuukausittain'
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⏰ Ajastetut kyselyt</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Uusi ajastus
        </button>
      </div>
      
      {/* Info box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Huomio ajastuksista</p>
            <p className="mt-1">
              Ajastetut kyselyt toimivat vain kun selain on auki. Täydellistä ajastusta varten 
              tarvittaisiin palvelinpuolen toteutus. Voit myös ajaa kyselyjä manuaalisesti 
              "Suorita nyt" -painikkeella.
            </p>
          </div>
        </div>
      </div>
      
      {/* Scheduled queries list */}
      {scheduled.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ei ajastettuja kyselyitä</p>
          <p className="text-sm text-gray-400 mt-1">
            Luo ajastus seurataksesi brändinäkyvyyttä ajan kuluessa
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduled.map(query => (
            <div key={query.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{query.prompt}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {intervalLabels[query.interval]} klo {query.time}
                    </span>
                    
                    <span className={`px-2 py-0.5 rounded ${query.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {query.enabled ? 'Aktiivinen' : 'Pysäytetty'}
                    </span>
                    
                    {query.brands && query.brands.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {query.brands.length} brändiä
                      </span>
                    )}
                  </div>
                  
                  {query.lastRun && (
                    <p className="text-xs text-gray-400 mt-2">
                      Viimeksi ajettu: {new Date(query.lastRun).toLocaleString('fi-FI')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runNow(query.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Suorita nyt"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => toggleEnabled(query.id)}
                    className={`p-2 rounded-lg ${query.enabled ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                    title={query.enabled ? 'Pysäytä' : 'Aktivoi'}
                  >
                    {query.enabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
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
      
      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">Uusi ajastettu kysely</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kysymys
                </label>
                <textarea
                  value={newQuery.prompt}
                  onChange={(e) => setNewQuery({ ...newQuery, prompt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Esim: Mitä pyykinpesuainetta suosittelet?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mallit
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        const models = newQuery.models.includes(model.id)
                          ? newQuery.models.filter(m => m !== model.id)
                          : [...newQuery.models, model.id]
                        setNewQuery({ ...newQuery, models })
                      }}
                      className={`px-3 py-1 rounded border text-sm ${
                        newQuery.models.includes(model.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seurattavat brändit
                </label>
                {newQuery.brands.map((brand, i) => (
                  <input
                    key={i}
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      const brands = [...newQuery.brands]
                      brands[i] = e.target.value
                      setNewQuery({ ...newQuery, brands })
                    }}
                    className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
                    placeholder="Brändin nimi"
                  />
                ))}
                <button
                  onClick={() => setNewQuery({ ...newQuery, brands: [...newQuery.brands, ''] })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Lisää brändi
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toistuvuus
                  </label>
                  <select
                    value={newQuery.interval}
                    onChange={(e) => setNewQuery({ ...newQuery, interval: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Päivittäin</option>
                    <option value="weekly">Viikottain</option>
                    <option value="monthly">Kuukausittain</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kellonaika
                  </label>
                  <input
                    type="time"
                    value={newQuery.time}
                    onChange={(e) => setNewQuery({ ...newQuery, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Peruuta
              </button>
              <button
                onClick={handleCreate}
                disabled={!newQuery.prompt.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Luo ajastus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function calculateNextRun(interval, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  
  if (next <= new Date()) {
    switch (interval) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }
  }
  
  return next.toISOString()
}
