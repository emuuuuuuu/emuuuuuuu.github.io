import { Link } from 'react-router-dom'
import { articles, formatDate } from '../content/articles'

export default function Writing() {
  return (
    <div className="writing-index">
      <ul className="writing-list">
        {articles.map(a => (
          <li key={a.slug} className="writing-item">
            <Link to={`/writing/${a.slug}`} className="writing-link">
              <span className="writing-title">{a.title}</span>
              {a.date && <span className="writing-date">{formatDate(a.date)}</span>}
            </Link>
            {a.blurb && <p className="writing-blurb">{a.blurb}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
