/*
 * NO POPUNDERS on the site pages, the same guard as in public/decide/js/ads.js (read the note there). Installed
 * before the network's code is added to a page; nothing of this site's own calls window.open, so nothing is allowed.
 */
export function installOpenGuard() {
  const w = window as unknown as { __m45Guard?: boolean }
  if (w.__m45Guard) return
  w.__m45Guard = true
  window.open = () => null
  document.addEventListener(
    'click',
    (e) => {
      if (e.isTrusted) return
      const a = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null
      if (a && a.href && /^https?:/i.test(a.href) && a.origin !== location.origin) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    },
    true,
  )
}

/** Closes the same door in a frame an ad drew for itself inside the page. */
export function guardFrames(root: Element | null) {
  if (!root) return
  root.querySelectorAll('iframe').forEach((f) => {
    try {
      if (f.contentWindow) (f.contentWindow as unknown as { open: () => null }).open = () => null
    } catch {
      /* another origin: not ours to reach */
    }
  })
}
