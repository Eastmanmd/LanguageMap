import languages from '../data/languages.json'

export default function LanguageProfile({ language, onSelectLanguage, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 text-sm text-blue-700 hover:underline"
      >
        &larr; Back to state
      </button>

      <h3 className="text-lg font-semibold text-gray-900">{language.name}</h3>

      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-500">Classification</dt>
          <dd className="text-gray-800">{language.classification}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Associated ethnic group(s)</dt>
          <dd className="text-gray-800">{language.ethnicGroups.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Description</dt>
          <dd className="text-gray-800 leading-relaxed">{language.description}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Similar languages</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {language.similarLanguages.map((id) => {
              const sim = languages[id]
              if (!sim) return null
              return (
                <button
                  key={id}
                  onClick={() => onSelectLanguage(id)}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  {sim.name}
                </button>
              )
            })}
          </dd>
        </div>
      </dl>
    </div>
  )
}
