import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  Search, Settings, BarChart3, History, Plus, Play, 
  Trash2, Copy, Download, Upload, Eye, Clock
} from 'lucide-react'
import QueryBuilder from './components/QueryBuilder'
import ResultsView from './components/ResultsView'
import Dashboard from './components/Dashboard'
import HistoryView from './components/HistoryView'
import SettingsView from './components/SettingsView'
import ScheduledQueries from './components/ScheduledQueries'

function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Search, label: 'Kysely' },
    { path: '/history', icon: History, label: 'Historia' },
    { path: '/scheduled', icon: Clock, label: 'Ajastetut' },
    { path: '/dashboard', icon: BarChart3, label: 'Analyysi' },
    { path: '/settings', icon: Settings, label: 'Asetukset' },
  ]
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">AI Brand Research</span>
          </div>
          
          <div className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<QueryBuilder />} />
            <Route path="/results/:id" element={<ResultsView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/scheduled" element={<ScheduledQueries />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
        
        <footer className="text-center py-4 text-gray-500 text-sm">
          AI Brand Research Tool — Tutki brändinäkyvyyttä tekoälyssä
        </footer>
      </div>
    </Router>
  )
}

export default App
