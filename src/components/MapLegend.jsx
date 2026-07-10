const ITEMS = [
  { color: 'bg-blue-600', label: 'Not selected' },
  { color: 'bg-orange-500', label: 'Selected state' },
  { color: 'bg-green-600', label: 'Search match' },
]

export default function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-black/80 dark:text-gray-300">
      <ul className="space-y-1">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
