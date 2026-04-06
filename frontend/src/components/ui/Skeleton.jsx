export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#13131F] border border-[#1E1E30] animate-pulse">
      <div className="bg-[#1A1A2E] aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1A1A2E] rounded w-3/4" />
        <div className="h-2.5 bg-[#1A1A2E] rounded w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-[#1A1A2E] rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  )
}
