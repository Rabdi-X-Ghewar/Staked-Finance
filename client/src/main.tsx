import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter

import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/component/theme-provider.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <ErrorBoundary>
      <BrowserRouter>
    <ThemeProvider>
    <App />
    </ThemeProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
