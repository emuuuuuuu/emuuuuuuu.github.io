import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Home from './components/Home'
import ModelingGallery from './components/ModelingGallery'
import AnimationGallery from './components/AnimationGallery'

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className={`app-container${isHome ? ' home-route' : ''}`}>
      <div className="header-container">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          EMIL
        </h1>
        <nav className="navbar">
          <ul>
            <li>
              <NavLink to="/graphics">Graphics</NavLink>
            </li>
            <li>
              <a href="https://github.com/emuuuuuuu" target="_blank" rel="noopener noreferrer" className="github-link">
                Github
              </a>
            </li>
            <li>
              <NavLink to="/animation">Animation</NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/graphics" element={<ModelingGallery />} />
          <Route path="/animation" element={<AnimationGallery />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
