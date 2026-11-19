import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const duration = toast.action ? 9000 : (toast.duration || 4000);
        const timer = setTimeout(() => {
            onDismiss();
        }, duration);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    if (!toast) return null;

    const { message, type = 'info', action } = toast;
    const isError = type === 'error';
    const isSuccess = type === 'success';

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div
                className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-sm ${
                    isError
                        ? 'bg-red-50/95 border-red-200 text-red-900'
                        : isSuccess
                        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                        : 'bg-white/95 border-gray-200 text-gray-900'
                }`}
            >
                {isError && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                {!isError && !isSuccess && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                
                <div className="flex-1 text-sm font-medium leading-snug">
                    <div>{message}</div>
                    {action && (
                        <button
                            type="button"
                            onClick={() => {
                                action.onClick();
                                onDismiss();
                            }}
                            className="mt-2 text-xs font-semibold px-2.5 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
