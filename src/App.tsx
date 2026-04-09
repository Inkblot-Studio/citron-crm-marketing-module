import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const MarketingWithProvider = lazy(() => import('@/marketing/MarketingWithProvider'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-surface-1" />}>
              <MarketingWithProvider />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
