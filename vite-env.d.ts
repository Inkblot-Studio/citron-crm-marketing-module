/// <reference types="vite/client" />

declare module 'host/ToastContext' {
  import type { ReactNode } from 'react'
  export interface ToastItem {
    id: string
    title: ReactNode
    description?: ReactNode
    variant?: 'info' | 'success' | 'warning' | 'error'
  }
  export function useToast(): {
    toasts: ToastItem[]
    addToast: (toast: Omit<ToastItem, 'id'>) => void
    dismissToast: (id: string) => void
  }
  export function ToastProvider({ children }: { children: ReactNode }): JSX.Element
}
