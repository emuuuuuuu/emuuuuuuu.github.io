import { useState, useEffect, useCallback, useRef } from 'react'
import { useSwipeable } from 'react-swipeable'

export default function FullscreenGallery({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [visible, setVisible] = useState(false)
  const [scale, setScale] = useState(1)
  const galleryRef = useRef(null)

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowRight') setIndex(i => (i + 1) % images.length)
    else if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + images.length) % images.length)
    else if (e.key === 'Escape') close()
  }, [images.length, close])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    setVisible(true)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => { setScale(1) }, [index])

  useEffect(() => {
    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = -e.deltaY * 0.02
      setScale(s => Math.min(6, Math.max(1, s + delta)))
    }
    document.addEventListener('wheel', onWheel, { passive: false })
    return () => document.removeEventListener('wheel', onWheel)
  }, [])

  const handlers = useSwipeable({
    onSwipedLeft: () => setIndex(i => (i + 1) % images.length),
    onSwipedRight: () => setIndex(i => (i - 1 + images.length) % images.length),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div
      ref={galleryRef}
      className={`fullscreen-gallery ${visible ? 'visible' : ''}`}
      onClick={e => e.target === e.currentTarget && close()}
      {...handlers}
    >
      <img
        src={`/img/${images[index]}`}
        alt={`Fullscreen ${index + 1}`}
        className={visible ? 'visible' : ''}
        onClick={e => e.stopPropagation()}
        style={{ transform: `scale(${scale})` }}
      />
      <button className="gallery-button left" aria-label="Previous image" onClick={() => setIndex(i => (i - 1 + images.length) % images.length)}>{'<'}</button>
      <button className="gallery-button right" aria-label="Next image" onClick={() => setIndex(i => (i + 1) % images.length)}>{'>'}</button>
      <button className="close-button" onClick={close}>×</button>
      <div className="gallery-counter">{index + 1} / {images.length}</div>
    </div>
  )
}
