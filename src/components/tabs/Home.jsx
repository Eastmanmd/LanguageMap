const FEATURES = [
  {
    title: 'Interactive map',
    description:
      'Click any region on a live, zoomable map to see which languages are spoken there.',
    badge: null,
  },
  {
    title: 'Language profiles',
    description:
      'Explore linguistic classification, associated ethnic groups, and the closest relatives of each language.',
    badge: null,
  },
  {
    title: 'Compare languages',
    description: 'Put two or more languages side by side to see how they relate.',
    badge: 'Coming soon',
  },
  {
    title: 'Blog',
    description: 'Articles and research notes on language documentation and mapping.',
    badge: 'Coming soon',
  },
]

const STATS = [
  { value: '37', label: 'States mapped in Nigeria' },
  { value: '350+', label: 'Languages catalogued' },
  { value: '1', label: 'Country live today' },
]

export default function Home({ onNavigate }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <section className="px-6 pt-20 pb-16 md:px-10 md:pt-28 md:pb-24">
        <p className="text-sm font-medium text-blue-600">LanguageMap</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-gray-900 md:text-6xl">
          Mapping the world&apos;s languages, region by region.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
          An interactive tool for exploring linguistic diversity. Click a region to see
          its languages, then dig into classification, ethnic groups, and linguistic
          relatives. The project is launching with Nigeria as its first fully mapped
          region, with the data model built to extend worldwide.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('map')}
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Explore the map
          </button>
        </div>
      </section>

      <div className="border-t border-gray-200 px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-medium tracking-tight text-gray-900">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="border-t border-gray-200 px-6 py-16 md:px-10 md:py-20">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          What you can do
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-base font-medium text-gray-900">
                  {feature.title}
                </h3>
                {feature.badge && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    {feature.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-16 md:px-10 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-medium tracking-tight text-gray-900 md:text-3xl">
            Starting with Nigeria
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            Nigeria alone is home to hundreds of languages across several major
            language families &mdash; Niger-Congo, Afro-Asiatic, and Nilo-Saharan among
            them. It's a natural place to start: linguistically dense, well-documented,
            and geographically compact enough to map state by state. From here, the
            same data model extends to other countries and regions over time.
          </p>
          <button
            onClick={() => onNavigate('map')}
            className="mt-6 text-sm font-medium text-blue-600 hover:underline"
          >
            See the Nigeria map &rarr;
          </button>
        </div>
      </section>
    </div>
  )
}
