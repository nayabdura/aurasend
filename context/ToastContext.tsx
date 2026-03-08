'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

interface Toast {
    id: number;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    addToast: (title: string, message: string, type: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((title: string, message: string, type: Toast['type']) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    // Listen to System Events for auto-notifications
    useEffect(() => {
        const eventSource = new EventSource('/api/events/stream');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') return;

                const msgMap: Record<string, { title: string, type: Toast['type'] }> = {
                    'EMAIL_SENT': { title: 'Email Sent', type: 'success' },
                    'EMAIL_REPLIED': { title: 'New Reply!', type: 'success' },
                    'BOUNCE_DETECTED': { title: 'Email Bounced', type: 'error' },
                    'WARMUP_SENT': { title: 'Warmup Email Sent', type: 'info' },
                    'GMAIL_CONNECTED': { title: 'Gmail Connected', type: 'success' },
                };

                const config = msgMap[data.type];
                if (config) {
                    addToast(config.title, data.details?.email || data.details?.to || '', config.type);
                }
            } catch (e) { }
        };

        return () => eventSource.close();
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-4 animate-in slide-in-from-right-10 fade-in duration-300 overflow-hidden relative group"
                    >
                        <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-600' :
                                toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> :
                                toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm">{toast.title}</h4>
                            <p className="text-gray-500 text-xs truncate">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={16} />
                        </button>
                        {/* Progress Bar */}
                        <div className={`absolute bottom-0 left-0 h-1 transition-all duration-[5000ms] ease-linear ${toast.type === 'success' ? 'bg-green-500' :
                                toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`} style={{ width: '100%', animation: 'shrink 5s linear forwards' }}></div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export const useToasts = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToasts must be used within ToastProvider');
    return context;
};
