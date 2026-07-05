import { useState } from 'react'
import Home from './components/tabs/Home'
import MapExplorer from './components/tabs/MapExplorer'
import CompareLanguages from './components/tabs/CompareLanguages'
import Blog from './components/tabs/Blog'

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'map', label: 'Map' },
  { id: 'compare', label: 'Compare languages' },
  { id: 'blog', label: 'Blog' },
]

function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b border-gray-200">
        <div className="flex items-center gap-2 px-6 pt-4">
          <div className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-[15px] font-medium tracking-tight text-gray-900">
            LanguageMap
          </span>
        </div>

        <nav className="flex gap-6 px-6 pt-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main
        className={`flex flex-1 flex-col ${
          activeTab === 'home' ? 'overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
        {activeTab === 'map' && <MapExplorer />}
        {activeTab === 'compare' && <CompareLanguages />}
        {activeTab === 'blog' && <Blog />}
      </main>
    </div>
  )
}

export default App
