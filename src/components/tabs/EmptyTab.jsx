export default function EmptyTab({ title, description }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        </div>
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
    </div>
  )
}
