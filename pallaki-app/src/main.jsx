import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Handle GitHub Pages SPA 404 redirect
const redirectPath = new URLSearchParams(window.location.search).get('p')
if (redirectPath) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  window.history.replaceState(null, '', base + redirectPath + window.location.hash)
}
import './index.css'
import './styles/home.css'
import './styles/sections.css'
import './styles/listing.css'
import './styles/detail.css'
import './styles/dashboard.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
