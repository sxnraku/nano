import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[10002] flex flex-col items-end gap-3 pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            layout
            className={`pointer-events-auto flex items-start gap-3 p-3 border-4 shadow-[4px_4px_0_#000] min-w-[300px] max-w-sm
              ${toast.type === 'error'
                ? 'bg-rose-600 border-black text-white'
                : toast.type === 'success'
                  ? 'bg-green-500 border-black text-black'
                  : 'bg-yellow-400 border-black text-black'}`}
          >
            <div className={`mt-0.5 p-1 border-2 border-black
              ${toast.type === 'error' ? 'bg-black text-rose-500' :
                toast.type === 'success' ? 'bg-black text-green-400' :
                  'bg-black text-yellow-500'}`}>
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1 mr-2 mt-1">
              <p className="font-bold uppercase tracking-wide text-sm leading-tight text-shadow-sm">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 border-2 border-transparent transition-colors -mt-1 -mr-1 hover:bg-black/20
                ${toast.type === 'error' ? 'text-rose-200 hover:text-white' :
                  toast.type === 'success' ? 'text-green-900 hover:text-black' :
                    'text-amber-900 hover:text-black'}`}
            >
              <X className="w-5 h-5 font-bold" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
