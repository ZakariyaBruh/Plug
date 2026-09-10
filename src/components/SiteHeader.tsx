import { Link } from '@tanstack/react-router'

export function SiteHeader({
  user,
}: {
  user: { name?: string | null; preferred_username?: string | null } | null
}) {
  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
            morsels45
          </span>
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
            <path
              d="M1 7C3 2 5 2 7 5C9 8 11 8 13 5C15 2 17 2 19 5C20 6.5 21 6.5 21 6.5"
              stroke="var(--amber)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-[var(--text-dim)]">
          <a href="/decide/" className="hover:text-[var(--text)]">
            Play
          </a>
          <Link to="/how-it-works" className="hover:text-[var(--text)]">
            How it works
          </Link>
          <Link to="/premium" className="hover:text-[var(--text)]">
            Premium
          </Link>
          <Link to="/faq" className="hidden hover:text-[var(--text)] sm:inline">
            FAQ
          </Link>
          {user ? (
            <Link
              to="/account"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--amber)]"
            >
              {user.preferred_username ?? user.name ?? 'Account'}
            </Link>
          ) : (
            <a
              href="/api/oauth/login"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--amber)]"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
