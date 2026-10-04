import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render xatoligi ushlandi:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('cached_tg_user');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#0F1713] text-[#1A2E22] dark:text-[#E8F0EA] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black mb-1">Ilovani yuklashda xatolik yuz berdi</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs leading-relaxed">
            Iltimos, sahifani qayta yuklang yoki keshni tozalang.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-soft active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Qayta yuklash</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
