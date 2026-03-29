let nextId = 0;

export function useToast() {
  const toasts = useState<Array<{ id: number; message: string; type: string }>>('toasts', () => []);

  function show(message: string, type = 'default') {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 3500);
  }

  return {
    toasts: readonly(toasts),
    success: (m: string) => show(m, 'success'),
    error: (m: string) => show(m, 'error'),
  };
}