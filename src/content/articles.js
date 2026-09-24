import jobbsikt from './jobbsikt.md?raw'
import jobbsiktNo from './jobbsikt-no.md?raw'

/**
 * The article registry. To add a piece of writing:
 *   1. drop a markdown file in this folder
 *   2. import it with ?raw
 *   3. add an entry below
 *
 * A `translations` map holds other-language versions of the same piece; they
 * share the slug and are reached with ?lang=<code> rather than their own entry,
 * so the index lists each article once.
 * Routing, the /writing index, and navigation all follow from this list.
 * Newest first — the index renders them in array order.
 */
export const articles = [
  {
    slug: 'jobbsikt',
    title: 'Natural language guided job search',
    blurb: 'Matches frontier-LLM picks at 1/80 of the cost.',
    date: '2026-09-24',
    source: jobbsikt,
    translations: { no: jobbsiktNo },
  },
]

export const findArticle = slug => articles.find(a => a.slug === slug)

/** ISO date -> the reading order that language actually uses. */
export const formatDate = (iso, lang = 'en') => {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  if (lang === 'no') {
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }
  // en-GB abbreviates September to "Sept"; en-US gives the 3-letter form.
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  return `${date.getDate()} ${month} ${date.getFullYear()}`
}
