export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] animate-pulse">
      {/* Header skeleton */}
      <header className="border-b-4 border-[var(--text-primary)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-[var(--surface)]" />
          <div className="flex items-center gap-6">
            <div className="h-4 w-16 bg-[var(--surface)]" />
            <div className="h-4 w-16 bg-[var(--surface)]" />
            <div className="h-10 w-10 bg-[var(--surface)]" />
          </div>
        </div>
      </header>
      {/* Hero skeleton */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="h-16 w-3/4 bg-[var(--surface)] mb-4" />
          <div className="h-8 w-1/2 bg-[var(--surface)] mb-8" />
          <div className="h-12 w-40 bg-[var(--surface)]" />
        </div>
      </div>
      {/* Products skeleton */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="h-10 w-48 bg-[var(--surface)] mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-[var(--surface)]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}