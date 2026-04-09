import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AssistantMessage, EmailBlock } from '@citron-systems/citron-ui'
import { generateBlocksFromPrompt } from '@/lib/generateBlocks'

type ToastVariant = 'info' | 'success' | 'warning' | 'error'

interface AssistantHandlers {
  setBlocks: (blocks: EmailBlock[]) => void
  addToast: (t: { title: string; description?: string; variant?: ToastVariant }) => void
}

interface MarketingAssistantContextValue {
  open: boolean
  openAssistant: (initialPrompt?: string) => void
  closeAssistant: () => void
  messages: AssistantMessage[]
  isProcessing: boolean
  sendMessage: (text: string, files?: File[]) => void
  registerHandlers: (handlers: AssistantHandlers) => void
}

const MarketingAssistantContext = createContext<MarketingAssistantContextValue | null>(null)

export function useMarketingAssistant() {
  const ctx = useContext(MarketingAssistantContext)
  if (!ctx) throw new Error('useMarketingAssistant must be used within MarketingAssistantProvider')
  return ctx
}

export function MarketingAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const handlersRef = useRef<AssistantHandlers | null>(null)
  const processingRef = useRef(false)
  const requestIdRef = useRef(0)

  const registerHandlers = useCallback((h: AssistantHandlers) => {
    handlersRef.current = h
  }, [])

  const sendMessage = useCallback(async (text: string, _files?: File[]) => {
    if (processingRef.current) return

    const userMsg: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsProcessing(true)
    processingRef.current = true

    const reqId = ++requestIdRef.current

    try {
      const newBlocks = await generateBlocksFromPrompt(text)

      if (reqId !== requestIdRef.current) return

      handlersRef.current?.setBlocks(newBlocks)

      const reply: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Done — generated ${newBlocks.length} blocks. The editor has been updated.`,
      }
      setMessages((prev) => [...prev, reply])
      handlersRef.current?.addToast({
        title: 'Blocks generated',
        description: `${newBlocks.length} blocks added to editor`,
        variant: 'success',
      })
    } catch {
      if (reqId !== requestIdRef.current) return

      const errMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong generating the blocks. Try again.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      if (reqId === requestIdRef.current) {
        setIsProcessing(false)
        processingRef.current = false
      }
    }
  }, [])

  const openAssistant = useCallback(
    (initialPrompt?: string) => {
      setOpen(true)
      if (initialPrompt) sendMessage(initialPrompt)
    },
    [sendMessage],
  )

  const closeAssistant = useCallback(() => setOpen(false), [])

  return (
    <MarketingAssistantContext.Provider
      value={{ open, openAssistant, closeAssistant, messages, isProcessing, sendMessage, registerHandlers }}
    >
      {children}
    </MarketingAssistantContext.Provider>
  )
}
