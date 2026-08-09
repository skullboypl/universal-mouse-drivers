import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { umdLog } from './debug/umdLog'
import './styles/global.css'

/** Bump when HID transport changes — proves browser loaded fresh code. */
const UMD_BUILD = 'i18n-pl-en-v12'

umdLog('boot', 'info', 'UMD build', UMD_BUILD)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
