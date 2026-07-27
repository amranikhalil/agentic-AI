import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@webtui/css/base.css'
import '@webtui/css/utils/box.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
