import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { AdminPage } from './pages/AdminPage'
import { PublicSite } from './pages/PublicSite'
import { DownloadsPage } from './pages/DownloadsPage'
import { Toasts } from './components/ui'
import { useStudio } from './store/studio'
import { seedDemoSites } from './store/seed'

/** Toast host — mounted once so every surface can raise notifications. */
function ToastHost() {
  const toasts = useStudio((s) => s.toasts)
  const dismiss = useStudio((s) => s.dismissToast)
  return <Toasts toasts={toasts} onDismiss={dismiss} />
}

/** Scroll to top on navigation. */
function ScrollReset() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  const seeded = React.useRef(false)

  React.useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    seedDemoSites()
  }, [])

  return (
    <BrowserRouter>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor/:siteId" element={<EditorPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/site/:slug/*" element={<PublicSite />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </BrowserRouter>
  )
}
