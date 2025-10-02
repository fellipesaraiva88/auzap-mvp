import * as React from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
};

const variantIcons = {
  default: '💬',
  success: '✅',
  error: '❌',
  warning: '⚠️',
};

export function Toast({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`
        ${variantStyles[variant]}
        border rounded-lg p-4 shadow-lg
        animate-in slide-in-from-top-5 duration-300
        max-w-md w-full
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{variantIcons[variant]}</span>
        <div className="flex-1">
          {title && <div className="font-semibold text-gray-900">{title}</div>}
          {description && (
            <div className="text-sm text-gray-600 mt-1">{description}</div>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
