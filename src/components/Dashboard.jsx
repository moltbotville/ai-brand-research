import React, { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { getQueries } from '../services/storage'
import { AVAILABLE_MODELS, extractBrandMentions } from '../services/aiService'

export default function Dashboard() {
  const [queries, setQueries] = useState([])
  
  useEffect(() => {
    setQueries(getQueries())
  }, [])
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (queries.length === 0) return null
    
    // Brand mentions across all queries
    const brandMentions = {}
    const modelUsage = {}
    const queriesOverTime = {}
    
    queries.forEach(query => {
      // Count model usage
      query.models.forEach(modelId => {
        modelUsage[modelId] = (modelUsage[modelId] || 0) + 1
      })
      
      // Count queries by date
      const date = new Date(query.timestamp).toLocaleDateString('fi-FI')
      queriesOverTime[date] = (queriesOverTime[date] || 0) + 1
      
      // Count brand mentions
      if (query.brands && query.results) {
        query.results.forEach(result => {
          if (result.response) {
            const mentions = extractBrandMentions(result.response, query.brands)
            Object.entries(mentions).forEach(([brand, count]) => {
              if (!brandMentions[brand]) {
                brandMentions[brand] = { total: 0, byModel: {} }
              }
              brandMentions[brand].total += count
              brandMentions[brand].byModel[result.modelId] = 
                (brandMentions[brand].byModel[result.modelId] || 0) + count
            })
          }
        })
      }
    })
    
    return { brandMentions, modelUsage, queriesOverTime }
  }, [queries])
  
  if (queries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📊 Analyysi</h1>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">Ei vielä dataa analysoitavaksi.</p>
          <p className="text-sm text-gray-400">
            Tee kyselyitä nähdäksesi analyysit täällä.
          </p>
        </div>
      </div>
    )
  }
  
  // Prepare chart data
  const brandChartData = Object.entries(stats.brandMentions)
    .map(([brand, data]) => ({
      name: brand,
      total: data.total,
      ...data.byModel
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
  
  const modelChartData = Object.entries(stats.modelUsage).map(([modelId, count]) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId)
    return {
      name: model?.name || modelId,
      value: count,
      color: modelId === 'claude' ? '#f97316' : 
             modelId === 'gpt' ? '#22c55e' :
             modelId === 'gemini' ? '#3b82f6' : '#a855f7'
    }
  })
  
  const timeChartData = Object.entries(stats.queriesOverTime)
    .map(([date, count]) => ({ date, count }))
    .slice(-14) // Last 14 days
  
  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7']
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📊 Analyysi</h1>
      
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Kyselyjä yhteensä</p>
          <p className="text-3xl font-bold">{queries.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Seurattuja brändejä</p>
          <p className="text-3xl font-bold">{Object.keys(stats.brandMentions).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Brändimaininnat</p>
          <p className="text-3xl font-bold">
            {Object.values(stats.brandMentions).reduce((sum, b) => sum + b.total, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Malleja käytetty</p>
          <p className="text-3xl font-bold">{Object.keys(stats.modelUsage).length}</p>
        </div>
      </div>
      
      {/* Brand mentions chart */}
      {brandChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-lg mb-4">Brändimaininnat malleittain</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {AVAILABLE_MODELS.map((model, i) => (
                <Bar 
                  key={model.id}
                  dataKey={model.id}
                  name={model.name}
                  fill={COLORS[i]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Model usage pie chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-lg mb-4">Mallien käyttö</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={modelChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {modelChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Queries over time */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-lg mb-4">Kyselyt ajassa</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Top brands table */}
      {brandChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-lg mb-4">Top brändit</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Brändi</th>
                {AVAILABLE_MODELS.map(model => (
                  <th key={model.id} className={`text-center py-2 ${model.color}`}>
                    {model.name}
                  </th>
                ))}
                <th className="text-center py-2 font-bold">Yhteensä</th>
              </tr>
            </thead>
            <tbody>
              {brandChartData.map((brand, i) => (
                <tr key={brand.name} className="border-b">
                  <td className="py-2 font-medium">
                    {i + 1}. {brand.name}
                  </td>
                  {AVAILABLE_MODELS.map(model => (
                    <td key={model.id} className="text-center py-2">
                      {brand[model.id] || 0}
                    </td>
                  ))}
                  <td className="text-center py-2 font-bold">{brand.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
