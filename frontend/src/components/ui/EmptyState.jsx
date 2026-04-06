export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 bg-[#1E1E35] rounded-xl mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold
                     hover:bg-indigo-500 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
