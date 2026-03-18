export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow animate-pulse">
      <div className="bg-gray-200 aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}
