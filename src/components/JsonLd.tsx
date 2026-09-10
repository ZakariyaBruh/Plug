/*
 * Structured data — the machine-readable half of a page.
 *
 * A search engine reads prose to guess what a page is; this tells it. It is
 * what lets the FAQ show its questions in a result, and the homepage state its
 * price rather than leave it to be inferred from the copy.
 *
 * "<" is escaped because a JSON string containing "</script>" would otherwise
 * close this tag early and spill the rest of the document into the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
