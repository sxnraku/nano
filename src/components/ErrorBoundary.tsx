import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRecovery = () => {
    // Clear potentially corrupt session data but keep the main collection/stats
    localStorage.removeItem('nano-verse-active-battle');
    localStorage.removeItem('nano-verse-pvp-session');
    window.location.reload();
  };

  private handleFullReset = () => {
    if (window.confirm("WARNING: THIS WILL CLEAR ALL LOCAL DATA. ONLY USE IF STUCK FOREVER.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    const { children } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
            <div className="w-24 h-24 border-4 border-red-600 flex items-center justify-center animate-bounce relative z-10">
              <span className="text-6xl font-black text-red-600">!</span>
            </div>
          </div>

          <h1 className="text-5xl font-marker text-red-600 mb-2 drop-shadow-[4px_4px_0_#fff] -rotate-2">
            SYSTEM <span className="text-white">FAILURE</span>
          </h1>
          
          <div className="bg-red-900/20 border border-red-600/50 p-4 rounded-lg max-w-md mb-8 backdrop-blur-sm">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">// ERROR_LOG</p>
            <pre className="text-[10px] text-zinc-400 overflow-auto max-h-32 text-left bg-black/40 p-2">
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
            <button 
              onClick={() => window.location.reload()}
              className="group relative px-6 py-4 bg-white text-black font-black uppercase tracking-tighter shadow-[6px_6px_0_#dc2626] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              FAST REBOOT
            </button>
            
            <button 
              onClick={this.handleRecovery}
              className="group relative px-6 py-3 bg-zinc-900 text-red-500 border-2 border-red-600 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              CLEAN RECOVERY
            </button>

            <button 
              onClick={this.handleFullReset}
              className="mt-8 text-[10px] text-zinc-600 underline hover:text-zinc-400 transition-colors uppercase font-bold"
            >
              Emergency Wipe All Data
            </button>
          </div>

          <div className="mt-12 text-[8px] text-zinc-800 font-mono italic">
            NANO_VERSE_KERNEL_PANIC_REV_3.2
          </div>
        </div>
      );
    }

    return children;
  }
}
