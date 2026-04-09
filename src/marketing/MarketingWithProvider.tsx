import { ToastProvider, useToast } from '@/lib/ToastContext'
import { Toaster, AssistantPanel } from '@citron-systems/citron-ui'
import MarketingPage from './MarketingPage'
import { MarketingAssistantProvider, useMarketingAssistant } from './MarketingAssistantContext'

function MarketingShell() {
  const { toasts, dismissToast } = useToast()
  const { open, closeAssistant, messages, isProcessing, sendMessage } = useMarketingAssistant()

  return (
    <>
      <div className="h-full flex flex-row overflow-hidden">
        <main className="flex-1 min-w-0 h-full overflow-hidden">
          <MarketingPage />
        </main>

        <AssistantPanel
          open={open}
          onOpenChange={(v) => { if (!v) closeAssistant() }}
          title="Marketing AI"
          subtitle="Generate email content, templates, and more"
          messages={messages}
          onSend={({ text, files }) => sendMessage(text, files)}
          isProcessing={isProcessing}
          placeholder="Ask the assistant to generate email content…"
        />
      </div>

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
      <MarketingAssistantProvider>
        <MarketingShell />
      </MarketingAssistantProvider>
    </ToastProvider>
  )
}
