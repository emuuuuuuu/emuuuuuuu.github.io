import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Home from './components/Home'
import ModelingGallery from './components/ModelingGallery'
import AnimationGallery from './components/AnimationGallery'
import Writing from './components/Writing'
import ArticlePage from './components/ArticlePage'

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
              <a href="https://github.com/emuuuuuuu" target="_blank" rel="noopener noreferrer" className="github-link">
                Github
              </a>
            </li>
            <li>
              <NavLink to="/animation">Animation</NavLink>
            </li>
            <li>
              <NavLink to="/writing">Writing</NavLink>
            </li>
            <li>
              <NavLink to="/graphics">Graphics</NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/graphics" element={<ModelingGallery />} />
          <Route path="/animation" element={<AnimationGallery />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="/writing/:slug" element={<ArticlePage />} />
          {/* A mistyped or retired URL lands home rather than on a blank page. */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
