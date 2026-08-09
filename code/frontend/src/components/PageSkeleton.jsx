export default function PageSkeleton() {
  return (
    <div className="mx-auto min-h-[430px] w-full max-w-7xl px-4 py-8" aria-busy="true">
      <div className="mb-6 h-3 w-24 animate-pulse rounded-full bg-black/10" />
      <div className="mb-2 h-8 w-3/4 max-w-md animate-pulse rounded-lg bg-black/10" />
      <div className="mb-8 h-4 w-1/2 max-w-sm animate-pulse rounded-md bg-black/10" />
      <div className="mb-8 h-28 animate-pulse rounded-xl bg-brand-pale" />
      <div className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <div className="aspect-square animate-pulse bg-black/10" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 animate-pulse rounded-md bg-black/10" />
              <div className="h-3 w-1/2 animate-pulse rounded-md bg-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
