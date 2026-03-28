import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/home.css'
import './styles/sections.css'
import './styles/listing.css'
import './styles/detail.css'
import './styles/dashboard.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
