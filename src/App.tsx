import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@citron-systems/citron-ui'
import { ToastProvider, useToast } from 'host/ToastContext'

const MarketingPage = lazy(() => import('@/marketing/MarketingPage'))

function AppWithToaster() {
  const { toasts, dismissToast } = useToast()
  return (
    <Toaster
      toasts={toasts}
      position="bottom-right"
      onDismiss={dismissToast}
      className="fixed bottom-4 right-4 z-[100]"
    />
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppWithToaster />
        <Routes>
          <Route
            path="*"
            element={
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-surface-1" />}>
                <MarketingPage />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
