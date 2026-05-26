let _id = 0

export function useToast() {
  const toasts = useState<{ id: number; message: string; type: 'success' | 'error' }[]>('toasts', () => [])

  function show(message: string, type: 'success' | 'error' = 'success') {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3500)
  }

  return {
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
  }
}
