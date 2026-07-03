import { useState } from 'react'
import MapView from './components/MapView'
import InfoPanel from './components/InfoPanel'

function App() {
  const [selectedState, setSelectedState] = useState(null)

  const handleSelectState = (stateId, stateName) => {
    setSelectedState({ id: stateId, name: stateName })
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 bg-white px-5 py-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Nigeria Language Map
        </h1>
        <p className="text-sm text-gray-500">
          Click a state to explore the languages spoken there.
        </p>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="min-h-[45vh] flex-1 md:min-h-0">
          <MapView
            selectedStateId={selectedState?.id ?? null}
            onSelectState={handleSelectState}
          />
        </div>
        <aside className="w-full shrink-0 overflow-y-auto border-t border-gray-200 bg-white md:w-[340px] md:border-t-0 md:border-l">
          <InfoPanel
            selectedStateId={selectedState?.id ?? null}
            selectedStateName={selectedState?.name ?? null}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
