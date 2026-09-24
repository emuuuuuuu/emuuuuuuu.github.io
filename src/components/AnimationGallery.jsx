import { useState, useEffect } from 'react'

export default function AnimationGallery() {
  const [links, setLinks] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)

  useEffect(() => {
    fetch('/assets.json')
      .then(r => r.json())
      .then(d => setLinks(d.youtubeLinks))
      .catch(e => console.error('Error fetching video links:', e))
  }, [])

  return (
    <div className="video-gallery-container">
      <div className="video-masonry-grid">
        {links.map((v, i) => (
          <div key={i} className="video-masonry-grid_column">
            <div className="video-thumbnail" onClick={() => setActiveVideo(v.id)}>
              <img
                src={v.thumbnail ? `/thumbnails/${v.thumbnail}` : `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                alt={`Thumbnail for video ${i + 1}`}
                className="custom-thumbnail"
              />
              <svg className="play-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 4.5 20 12 8 19.5Z" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        ))}
      </div>
      {activeVideo && (
        <div className="fullscreen-video visible" onClick={() => setActiveVideo(null)}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onClick={e => e.stopPropagation()}
          />
          <button className="close-button" onClick={e => { e.stopPropagation(); setActiveVideo(null); }}>×</button>
        </div>
      )}
    </div>
  )
}
