import { ToastProvider, useToast } from '@/lib/ToastContext'
import { Toaster } from '@citron-systems/citron-ui'
import MarketingPage from './MarketingPage'

function MarketingWithToaster() {
  const { toasts, dismissToast } = useToast()
  return (
    <>
      <MarketingPage />
      <Toaster
        toasts={toasts}
        position="bottom-right"
        onDismiss={dismissToast}
        className="fixed bottom-4 right-4 z-[100]"
      />
    </>
  )
}

export default function MarketingWithProvider() {
  return (
    <ToastProvider>
      <MarketingWithToaster />
    </ToastProvider>
  )
}
