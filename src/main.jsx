import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NetraProvider } from './context/NetraContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NetraProvider>
      <App />
    </NetraProvider>
  </StrictMode>,
)
