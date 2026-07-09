import { useEffect, useMemo, useState } from 'react'
import MapView from '../MapView'
import InfoPanel from '../InfoPanel'
import LanguageSearch from '../LanguageSearch'
import languages from '../../data/languages.json'
import stateLanguages from '../../data/stateLanguages.json'

const LANGUAGE_OPTIONS = Object.values(languages)
  .map((lang) => ({ id: lang.id, name: lang.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export default function MapExplorer() {
  const [selectedState, setSelectedState] = useState(null)
  const [searchedLanguageId, setSearchedLanguageId] = useState(null)
  const [stateNames, setStateNames] = useState({})

  useEffect(() => {
    fetch('/data/nigeria-states.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        const names = {}
        for (const feature of geojson.features) {
          names[feature.properties.state_id] = feature.properties.name
        }
        setStateNames(names)
      })
      .catch(() => {})
  }, [])

  const handleSelectState = (stateId, stateName) => {
    setSelectedState({ id: stateId, name: stateName })
  }

  const highlightedStateIds = useMemo(() => {
    if (!searchedLanguageId) return []
    return Object.entries(stateLanguages)
      .filter(([, langIds]) => langIds.includes(searchedLanguageId))
      .map(([stateId]) => stateId)
  }, [searchedLanguageId])

  const searchedLanguage = searchedLanguageId ? languages[searchedLanguageId] : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div className="relative min-h-[45vh] flex-1 md:min-h-0">
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-col items-start gap-2 md:right-auto">
          <div className="pointer-events-auto w-full max-w-sm">
            <LanguageSearch
              languageOptions={LANGUAGE_OPTIONS}
              selectedLanguage={searchedLanguageId}
              onSelect={setSearchedLanguageId}
              onClear={() => setSearchedLanguageId(null)}
            />
          </div>
          {searchedLanguage && (
            <div className="pointer-events-auto max-w-sm rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-lg backdrop-blur">
              {highlightedStateIds.length > 0 ? (
                <>
                  <span className="font-medium text-gray-900">{searchedLanguage.name}</span>{' '}
                  is spoken in {highlightedStateIds.length} state
                  {highlightedStateIds.length === 1 ? '' : 's'}:{' '}
                  {highlightedStateIds
                    .map((id) => stateNames[id] ?? id)
                    .sort()
                    .join(', ')}
                </>
              ) : (
                <>No states found for {searchedLanguage.name}.</>
              )}
            </div>
          )}
        </div>
        <MapView
          selectedStateId={selectedState?.id ?? null}
          onSelectState={handleSelectState}
          highlightedStateIds={highlightedStateIds}
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
