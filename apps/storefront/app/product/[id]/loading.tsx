export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] animate-pulse">
      {/* Header skeleton */}
      <header className="border-b-4 border-[var(--text-primary)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-[var(--surface)]" />
          <div className="flex items-center gap-6">
            <div className="h-4 w-16 bg-[var(--surface)]" />
            <div className="h-10 w-10 bg-[var(--surface)]" />
          </div>
        </div>
      </header>
      {/* Product detail skeleton */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image skeleton */}
          <div className="aspect-square bg-[var(--surface)]" />
          {/* Info skeleton */}
          <div className="flex flex-col gap-4">
            <div className="h-10 w-3/4 bg-[var(--surface)]" />
            <div className="h-8 w-24 bg-[var(--surface)]" />
            <div className="h-4 w-full bg-[var(--surface)]" />
            <div className="h-4 w-2/3 bg-[var(--surface)]" />
            <div className="h-12 w-48 bg-[var(--surface)] mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}