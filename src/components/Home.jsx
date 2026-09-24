export default function Home() {
  return (
    <div className="home-container">
      <video
        src="/gauss_tighter_1200001-0742.mp4"
        autoPlay
        muted
        playsInline
        /* The clip opens on dead frames; skip past them. */
        onLoadedMetadata={e => { e.currentTarget.currentTime = 1.2 }}
        className="background-video"
      />
    </div>
  )
}
