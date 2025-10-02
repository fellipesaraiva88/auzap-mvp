import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/Toast';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'success' }),

    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'error' }),

    warning: (title: string, description?: string) =>
      addToast({ title, description, variant: 'warning' }),

    default: (title: string, description?: string) =>
      addToast({ title, description, variant: 'default' }),
  };

  return { toast, toasts, removeToast };
}
