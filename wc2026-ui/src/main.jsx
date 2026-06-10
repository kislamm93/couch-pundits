import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Apply the saved theme before React renders to avoid a flash. Defaults to dark.
const savedTheme = localStorage.getItem('wc_theme') === 'light' ? 'light' : 'dark'
document.documentElement.classList.remove('light', 'dark')
document.documentElement.classList.add(savedTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
