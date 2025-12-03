import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Ensure the React Refresh registration globals exist in dev before
// any transformed module (like ./App.tsx) runs. Some dev transforms
// expect window.$RefreshReg$ / window.$RefreshSig$ to be present
// to detect the preamble; if they're missing a runtime error is
// thrown and the page stays blank.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).$RefreshReg$ = (type: any, id?: string) => {}
  ;(window as any).$RefreshSig$ = () => (type: any) => type
}

// Dynamically import App after the globals are set so the module
// evaluation happens with the expected environment.
const { default: App } = await import('./App.tsx')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
