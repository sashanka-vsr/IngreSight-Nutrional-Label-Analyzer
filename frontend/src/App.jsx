import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import About from './pages/About.jsx'
import Stats from './pages/Stats.jsx'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/history" element={<History toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/about" element={<About toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/stats" element={<Stats toggleTheme={toggleTheme} theme={theme} />} />
      </Routes>
    </Router>
  )
}

export default App