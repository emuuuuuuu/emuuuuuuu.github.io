import { useState, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import FullscreenGallery from './FullscreenGallery'

const breakpointCols = { default: 3, 900: 2, 600: 1 }

export default function ModelingGallery() {
  const [images, setImages] = useState([])
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    fetch('/assets.json')
      .then(r => r.json())
      .then(d => setImages(d.images))
      .catch(e => console.error('Error fetching images:', e))
  }, [])

  return (
    <div className="modeling-container">
      <Masonry
        breakpointCols={breakpointCols}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={`/img_small/${img}`}
            alt={`3D Model ${i + 1}`}
            onClick={() => setOpenIndex(i)}
            className="masonry-image"
          />
        ))}
      </Masonry>
      {openIndex !== null && (
        <FullscreenGallery
          images={images}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  )
}
