import { Link } from '@tanstack/react-router'

import { AFFILIATES_URL } from '#/lib/site'

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
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-dim)]">
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
          {/* The affiliate programme existed in exactly one place before this:
              a button inside a prompt in the game that comes up occasionally.
              Nobody could go and find it on purpose. It belongs in the footer
              of every page, which is where people look for exactly this. */}
          <a
            href={AFFILIATES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text)]"
          >
            Earn from it
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl px-6 text-xs text-[var(--text-dim)]">
        © {new Date().getFullYear()} morsels45. Secure payments, powered by Whop.
      </p>
    </footer>
  )
}
