import { Link } from '@tanstack/react-router'


export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">morsels45</p>
          <p className="mt-2 max-w-xs text-sm text-[var(--text-dim)]">
            Stop scrolling. Start eating. Free to play. Premium is extra.
          </p>
        </div>
        {/* EVERY PAGE ON THE SITE IS IN HERE, and scripts/nav-test.mjs fails
            the build if one stops being. A footer that is nearly complete is
            worse than one that is obviously partial: it stops anybody
            looking. */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-dim)]">
          <Link to="/" className="hover:text-[var(--text)]">
            Home
          </Link>
          <a href="/decide/" className="hover:text-[var(--text)]">
            Play
          </a>
          <Link to="/eat" className="hover:text-[var(--text)]">
            All dishes
          </Link>
          <Link to="/how-it-works" className="hover:text-[var(--text)]">
            How it works
          </Link>
          <Link to="/premium" className="hover:text-[var(--text)]">
            Premium
          </Link>
          <Link to="/faq" className="hover:text-[var(--text)]">
            FAQ
          </Link>
          <Link to="/account" className="hover:text-[var(--text)]">
            Account
          </Link>
          <Link to="/privacy" className="hover:text-[var(--text)]">
            Privacy
          </Link>
          {/* In the footer of every page, next to Privacy, where people look
              for exactly this kind of promise. It is named for what it gives
              the reader rather than for what it admits. */}
          <Link to="/honesty" className="hover:text-[var(--text)]">
            What we won&rsquo;t do
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl px-6 text-xs text-[var(--text-dim)]">
        © {new Date().getFullYear()} morsels45. Secure payments, powered by Whop.
      </p>
    </footer>
  )
}
