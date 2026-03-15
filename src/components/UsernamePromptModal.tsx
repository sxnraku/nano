import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight, LogIn, UserPlus, Mail, Lock, User as UserIcon, UserCircle } from 'lucide-react';

type AuthMode = 'GUEST' | 'LOGIN' | 'SIGNUP';

export function UsernamePromptModal({
    onSubmit,
    onEmailLogin,
    onEmailSignUp,
    errorMessage
}: {
    onSubmit: (username: string) => Promise<void>;
    onEmailLogin: (email: string, pass: string) => Promise<void>;
    onEmailSignUp: (email: string, pass: string, username: string) => Promise<void>;
    errorMessage?: string | null;
}) {
    const [mode, setMode] = useState<AuthMode>('GUEST');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (mode === 'GUEST') {
                if (!username.trim()) return;
                await onSubmit(username.trim());
            } else if (mode === 'LOGIN') {
                if (!email || !password) return;
                await onEmailLogin(email, password);
            } else if (mode === 'SIGNUP') {
                if (!email || !password || !username.trim()) return;
                await onEmailSignUp(email, password, username.trim());
            }
        } catch (error) {
            console.error("Auth attempt failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 min-h-[100dvh]">
            <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
            <div className="scanlines pointer-events-none opacity-50" />

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm bg-zinc-900 border-[6px] border-black shadow-[12px_12px_0_#000] overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10" />

                {/* Header */}
                <div className="bg-yellow-400 border-b-[6px] border-black p-5 relative z-10 flex flex-col items-center">
                    <h2 className="font-marker text-3xl uppercase text-black drop-shadow-[2px_2px_0_#fff] -rotate-1 tracking-tighter text-center">
                        NANOVERSE ACCESS
                    </h2>
                    <div className="mt-1 px-3 py-0.5 bg-black text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        {mode === 'GUEST' ? 'Secure Proxy' : mode === 'LOGIN' ? 'Encrypted Login' : 'New Identity'}
                    </div>
                </div>

                <div className="p-6 relative z-10">
                    {/* Tabs */}
                    <div className="flex border-4 border-black mb-6 bg-zinc-800 shadow-[4px_4px_0_#000]">
                        <button
                            onClick={() => setMode('GUEST')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase transition-all ${mode === 'GUEST' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                        >
                            Guest
                        </button>
                        <button
                            onClick={() => setMode('LOGIN')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase border-l-4 border-black transition-all ${mode === 'LOGIN' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('SIGNUP')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase border-l-4 border-black transition-all ${mode === 'SIGNUP' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500 border-4 border-black text-white text-[10px] font-black p-3 mb-4 shadow-[4px_4px_0_#000]"
                        >
                            ERROR: {errorMessage}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-3"
                            >
                                {(mode === 'SIGNUP' || mode === 'GUEST') && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-zinc-500 font-black uppercase text-[10px] flex items-center gap-1.5">
                                            <UserIcon className="w-3 h-3" />
                                            {mode === 'GUEST' ? 'Temporary Alias' : 'Username'}
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="ALIAS_X"
                                            required
                                            className="w-full bg-black border-4 border-zinc-800 text-white font-mono font-bold p-3 focus:outline-none focus:border-yellow-400 transition-colors uppercase text-sm"
                                            maxLength={15}
                                        />
                                    </div>
                                )}

                                {(mode === 'LOGIN' || mode === 'SIGNUP') && (
                                    <>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-zinc-500 font-black uppercase text-[10px] flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="NET@MATRIX.COM"
                                                required
                                                className="w-full bg-black border-4 border-zinc-800 text-white font-mono font-bold p-3 focus:outline-none focus:border-yellow-400 transition-colors uppercase text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-zinc-500 font-black uppercase text-[10px] flex items-center gap-1.5">
                                                <Lock className="w-3 h-3" />
                                                Passcode
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="w-full bg-black border-4 border-zinc-800 text-white font-mono font-bold p-3 focus:outline-none focus:border-yellow-400 transition-colors text-sm"
                                            />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="bg-red-500/10 border border-red-500/30 p-2 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-red-100 uppercase leading-tight">
                                <span className="text-red-400">Security Warning:</span> {mode === 'GUEST' ? 'Guest data stays on this device only. Use email to sync profiles.' : 'Encrypted link established. Data transmission active.'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-yellow-400 text-black font-black uppercase tracking-[0.2em] border-4 border-black shadow-[6px_6px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2 mt-2"
                        >
                            {isSubmitting ? 'CONNECTING...' : mode === 'GUEST' ? 'LINK START' : mode === 'LOGIN' ? 'AUTHORIZE' : 'INITIATE'}
                            {!isSubmitting && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
