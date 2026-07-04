import { useState } from 'react'
import MapView from '../MapView'
import InfoPanel from '../InfoPanel'

export default function MapExplorer() {
  const [selectedState, setSelectedState] = useState(null)

  const handleSelectState = (stateId, stateName) => {
    setSelectedState({ id: stateId, name: stateName })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
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
    </div>
  )
}
