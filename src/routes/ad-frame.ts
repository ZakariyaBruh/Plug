import { createFileRoute } from '@tanstack/react-router'

import { AD_UNITS, adLive, type AdSize } from '#/lib/site'

/*
 * THE PAGE AN AD LIVES IN. Every ad on the site and in the app is an iframe pointing here
 * (?u=mobile, ?u=leaderboard ...), sandboxed by the page that embeds it.
 *
 * WHY A PAGE AND NOT srcdoc. A banner network decides whether to fill from who is asking:
 * the address the script was requested from, and the site it says it is on. A srcdoc frame
 * has no address of its own, and when the embedding page also asked for no referrer at all
 * (which is what "load it without cookies" used to mean) the request arrived from nowhere.
 * Here the frame is a real page on this site, the script is requested with this site's
 * address as the referrer (only the address of the site, never a path: `origin`), and the
 * page reports back to the embedding page whether anything arrived, which is how the app
 * knows to show its own card instead of an empty box.
 *
 * Which unit is looked up by name in AD_UNITS, never taken from the URL, so this cannot be
 * pointed at somebody else's script.
 */
export const adFramePage = (name: AdSize): string | null => {
  const unit = AD_UNITS[name]
  if (!unit || !adLive(unit)) return null
  const options = JSON.stringify({ key: unit.key, format: 'iframe', height: unit.height, width: unit.width, params: {} })
  return (
    // No <head> or <html> tags on purpose: the host adds its own page-view script to the head of any
    // page it serves, and an ad frame is not a page view. The parser builds the head from the meta tags.
    '<!doctype html><meta charset="utf-8"><meta name="referrer" content="origin">' +
    `<meta name="viewport" content="width=${unit.width}">` +
    '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style><body>' +
    `<script>atOptions=${options};</script>` +
    `<script id="ad-src" src="${unit.src}"></script>` +
    // Tell the page that holds this frame what happened: 'filled' the moment anything is drawn,
    // 'error' if the script could not be loaded, 'empty' if six seconds pass with nothing.
    '<script>(function(){var u=' + JSON.stringify(name) + ',sent="";function say(s){if(sent==="filled"||sent===s)return;sent=s;try{parent.postMessage({m45ad:{u:u,s:s}},"*")}catch(e){}}' +
    'var el=document.getElementById("ad-src");if(el)el.addEventListener("error",function(){say("error")});' +
    'function count(){return document.body.querySelectorAll(":not(script):not(style)").length}' +
    'try{new MutationObserver(function(){if(count())say("filled")}).observe(document.body,{childList:true,subtree:true})}catch(e){}' +
    'if(count())say("filled");setTimeout(function(){say(count()?"filled":"empty")},6000)})();</script>' +
    '</body>'
  )
}

export const Route = createFileRoute('/ad-frame')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const name = new URL(request.url).searchParams.get('u') as AdSize | null
        const html = name ? adFramePage(name) : null
        if (!html) return new Response('not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'origin', 'Cache-Control': 'public, max-age=600' },
        })
      },
    },
  },
})
