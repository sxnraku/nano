import React, { useState, useEffect, useRef } from 'react';
import { X, Bug, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface LogEntry {
    id: number;
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: string;
}

let logId = 0;
const MAX_LOGS = 100;

// Global log storage so we capture logs even before the component mounts
const logBuffer: LogEntry[] = [];
const listeners: Set<() => void> = new Set();

function addLog(type: LogEntry['type'], args: any[]) {
    const message = args.map(a => {
        if (typeof a === 'string') return a;
        try {
            return JSON.stringify(a, null, 2);
        } catch {
            return String(a);
        }
    }).join(' ');

    const entry: LogEntry = {
        id: logId++,
        type,
        message,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
    };

    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
    listeners.forEach(l => l());
}

// Intercept console methods
if (typeof window !== 'undefined' && !(window as any).__debugConsolePatched) {
    (window as any).__debugConsolePatched = true;
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    console.log = (...args) => { origLog(...args); addLog('log', args); };
    console.warn = (...args) => { origWarn(...args); addLog('warn', args); };
    console.error = (...args) => { origError(...args); addLog('error', args); };
    console.info = (...args) => { origInfo(...args); addLog('info', args); };

    // Catch unhandled errors
    window.addEventListener('error', (e) => {
        addLog('error', [`UNHANDLED: ${e.message} at ${e.filename}:${e.lineno}`]);
    });
    window.addEventListener('unhandledrejection', (e) => {
        addLog('error', [`UNHANDLED PROMISE: ${e.reason?.message || e.reason}`]);
    });
}

const typeColors: Record<LogEntry['type'], string> = {
    log: '#a1a1aa',    // zinc-400
    info: '#38bdf8',   // sky-400
    warn: '#facc15',   // yellow-400
    error: '#ef4444',  // red-500
};

export function DebugConsole() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([...logBuffer]);
    const [errorCount, setErrorCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const update = () => {
            setLogs([...logBuffer]);
            setErrorCount(logBuffer.filter(l => l.type === 'error').length);
        };
        listeners.add(update);
        return () => { listeners.delete(update); };
    }, []);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    const clearLogs = () => {
        logBuffer.length = 0;
        setLogs([]);
        setErrorCount(0);
    };

    // Only show in development
    if ((import.meta as any).env?.PROD) return null;

    return (
        <>
            {/* Floating debug button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 right-3 z-[9999] w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{
                        background: errorCount > 0 ? '#dc2626' : '#27272a',
                        border: '2px solid ' + (errorCount > 0 ? '#fca5a5' : '#52525b'),
                    }}
                >
                    <Bug className="w-5 h-5 text-white" />
                    {errorCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-black">
                            {errorCount > 99 ? '99+' : errorCount}
                        </span>
                    )}
                </button>
            )}

            {/* Console panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex flex-col"
                    style={{ background: 'rgba(0,0,0,0.95)' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
                        <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-400 font-mono text-sm font-bold">DEBUG CONSOLE</span>
                            <span className="text-zinc-500 font-mono text-xs">({logs.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearLogs}
                                className="p-1.5 rounded bg-zinc-800 active:bg-zinc-700"
                            >
                                <Trash2 className="w-4 h-4 text-zinc-400" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded bg-zinc-800 active:bg-zinc-700"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs">
                        {logs.length === 0 && (
                            <div className="text-zinc-600 text-center py-8">
                                Sem logs ainda. Interage com a app para ver os logs aqui.
                            </div>
                        )}
                        {logs.map(log => (
                            <div
                                key={log.id}
                                className="py-1 px-2 mb-0.5 rounded"
                                style={{
                                    borderLeft: `3px solid ${typeColors[log.type]}`,
                                    background: log.type === 'error' ? 'rgba(239,68,68,0.1)' : 'transparent',
                                }}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                                    <span
                                        className="shrink-0 uppercase font-bold text-[10px] px-1 rounded"
                                        style={{ color: typeColors[log.type] }}
                                    >
                                        {log.type}
                                    </span>
                                    <pre
                                        className="whitespace-pre-wrap break-all flex-1"
                                        style={{ color: typeColors[log.type] }}
                                    >
                                        {log.message}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
