import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)] p-12">
          <h1 className="font-mono text-8xl font-bold text-[var(--text-primary)] mb-4">404</h1>
          <div className="w-16 h-1 bg-[var(--accent)] mx-auto mb-6" />
          <h2 className="font-mono text-2xl font-bold text-[var(--text-primary)] mb-3">
            PAGE NOT FOUND
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 font-mono font-bold uppercase tracking-wider border-2 border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
          >
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}