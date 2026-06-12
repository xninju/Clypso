export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#2a2a2a] rounded animate-pulse ${className}`} />
  );
}

export function VideoInfoSkeleton() {
  return (
    <div className="mt-5 bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden animate-pulse">
      <div className="flex gap-4 p-4">
        <div className="w-36 h-20 bg-[#2a2a2a] rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-[#2a2a2a] rounded w-16" />
          <div className="h-4 bg-[#2a2a2a] rounded w-full" />
          <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
          <div className="h-3 bg-[#2a2a2a] rounded w-24" />
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-9 bg-[#2a2a2a] rounded-lg w-20" />
        <div className="h-9 bg-[#2a2a2a] rounded-lg w-20" />
        <div className="h-9 bg-[#2a2a2a] rounded-lg w-20" />
      </div>
    </div>
  );
}

export function IgInfoSkeleton() {
  return (
    <div className="mt-5 bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden animate-pulse">
      <div className="flex gap-4 p-4">
        <div className="w-16 h-16 bg-[#2a2a2a] rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-[#2a2a2a] rounded w-12" />
          <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
          <div className="h-3 bg-[#2a2a2a] rounded w-24" />
        </div>
      </div>
      <div className="border-t border-[#3a3a3a] p-4 flex items-center gap-4">
        <div className="w-16 h-16 bg-[#2a2a2a] rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#2a2a2a] rounded w-32" />
          <div className="h-3 bg-[#2a2a2a] rounded w-20" />
        </div>
        <div className="h-9 bg-[#2a2a2a] rounded-lg w-24" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-[#212121] rounded-xl p-4 border border-[#3a3a3a] animate-pulse space-y-2">
          <div className="h-3 bg-[#2a2a2a] rounded w-24" />
          <div className="h-7 bg-[#2a2a2a] rounded w-16" />
        </div>
      ))}
    </div>
  );
}
