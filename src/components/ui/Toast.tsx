import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'error' | 'success' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<{ showToast: (kind: ToastKind, message: string) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx.showToast
}

const KIND_STYLE: Record<ToastKind, string> = {
  error: 'toast-error',
  success: 'toast-success',
  info: 'toast-info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${KIND_STYLE[t.kind]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
