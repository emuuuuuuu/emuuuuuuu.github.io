import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a markdown article with media embeds.
 *
 * Beyond normal markdown, fenced blocks with these languages become embeds:
 *
 *   ```youtube
 *   TMcRsvaGy9w
 *   Optional caption
 *   ```
 *
 *   ```video
 *   /article/rag/demo.mp4
 *   Optional caption
 *   ```
 *
 * Images use plain markdown; the alt text doubles as the caption:
 *   ![How chunks are scored](/article/rag/retrieval.png)
 */

function Figure({ children, caption }) {
  return (
    <figure className="article-figure">
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

function YouTube({ id, caption }) {
  return (
    <Figure caption={caption}>
      <div className="article-embed">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={caption || 'Video'}
          frameBorder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </Figure>
  )
}

function Video({ src, caption }) {
  return (
    <Figure caption={caption}>
      <video src={src} controls playsInline preload="metadata" className="article-video" />
    </Figure>
  )
}

const components = {
  // Media embeds ride in on fenced code blocks so the markdown stays plain text.
  code({ className, children, ...props }) {
    const lang = /language-(\w+)/.exec(className || '')?.[1]
    const body = String(children).replace(/\n$/, '')

    if (lang === 'youtube' || lang === 'video') {
      const [source, ...rest] = body.split('\n')
      const caption = rest.join(' ').trim()
      return lang === 'youtube'
        ? <YouTube id={source.trim()} caption={caption} />
        : <Video src={source.trim()} caption={caption} />
    }

    // Inline code has no language class and no newlines.
    if (!className && !body.includes('\n')) {
      return <code className="article-code-inline" {...props}>{children}</code>
    }

    return (
      <pre className="article-pre">
        <code className={className} {...props}>{children}</code>
      </pre>
    )
  },

  // react-markdown wraps code blocks in <pre>; ours already emits one.
  pre({ children }) {
    return <>{children}</>
  },

  img({ src, alt }) {
    return (
      <Figure caption={alt}>
        <img src={src} alt={alt || ''} className="article-image" loading="lazy" />
      </Figure>
    )
  },

  a({ href, children }) {
    const external = /^https?:\/\//.test(href || '')
    return (
      <a
        href={href}
        className="article-link"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },

  table({ children }) {
    return (
      <div className="article-table-scroll">
        <table className="article-table">{children}</table>
      </div>
    )
  },
}

export default function Article({ source }) {
  return (
    <article className="article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </article>
  )
}
