import languages from '../data/languages.json'

export default function LanguageProfile({ language, onSelectLanguage, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 text-sm text-blue-700 hover:underline dark:text-blue-400"
      >
        &larr; Back to state
      </button>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language.name}</h3>

      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-500 dark:text-gray-400">Classification</dt>
          <dd className="text-gray-800 dark:text-gray-200">{language.classification}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500 dark:text-gray-400">Associated ethnic group(s)</dt>
          <dd className="text-gray-800 dark:text-gray-200">{language.ethnicGroups.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500 dark:text-gray-400">Description</dt>
          <dd className="text-gray-800 leading-relaxed dark:text-gray-200">{language.description}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500 dark:text-gray-400">Similar languages</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {language.similarLanguages.map((id) => {
              const sim = languages[id]
              if (!sim) return null
              return (
                <button
                  key={id}
                  onClick={() => onSelectLanguage(id)}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
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
