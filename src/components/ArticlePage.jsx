import { useParams, Navigate, Link, useSearchParams } from 'react-router-dom'
import { findArticle, formatDate } from '../content/articles'
import Article from './Article'

// The original always sits under 'en'; everything else comes from `translations`.
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'no', label: 'Norsk' },
]

// Visitors land on the original; translations are reached with ?lang=<code>.
const PREFERRED_LANG = 'en'

export default function ArticlePage() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const article = findArticle(slug)

  // An unknown slug shouldn't dead-end on a blank page.
  if (!article) return <Navigate to="/writing" replace />

  const translations = article.translations || {}
  const has = code => code === 'en' || Boolean(translations[code])
  // Articles without the preferred translation simply stay on the original.
  const fallback = has(PREFERRED_LANG) ? PREFERRED_LANG : 'en'
  const requested = params.get('lang')
  // An unknown or untranslated ?lang falls back rather than 404.
  const lang = requested && has(requested) ? requested : fallback
  const source = lang === 'en' ? article.source : translations[lang]
  const available = LANGUAGES.filter(l => has(l.code))

  return (
    <div className="article-page" lang={lang}>
      <div className="article-topbar" lang="en">
        <Link to="/writing" className="article-back">
          <svg className="article-back-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor"
                  strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          writing
        </Link>
        <div className="article-topbar-meta">
          {article.date && (
            <time className="article-date" dateTime={article.date}>
              {formatDate(article.date, lang)}
            </time>
          )}
          {available.length > 1 && (
            <nav className="lang-switch" aria-label="Language">
              {available.map(l => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  className={`lang-option${l.code === lang ? ' active' : ''}`}
                  aria-current={l.code === lang ? 'true' : undefined}
                  // The language lives in the URL so a translation can be linked to.
                  onClick={() => setParams(l.code === fallback ? {} : { lang: l.code })}
                >
                  {l.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
      <Article key={lang} source={source} />
    </div>
  )
}
