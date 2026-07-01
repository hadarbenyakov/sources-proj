import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { resetAppData } from './lib/storage'
// Fonts from Figma: Plus Jakarta Sans (primary) + Inter (a few small labels).
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/inter/400.css'
// Big resource-card numbers use Montserrat Alternates (Figma node 925:1649).
import '@fontsource/montserrat-alternates/600.css'
import './styles/globals.css'

// A hard page refresh starts the demo fresh — clear any persisted offers/levels.
// (In-app navigation is SPA and never reloads this module, so it keeps state.)
resetAppData()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
