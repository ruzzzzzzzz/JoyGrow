import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😔</div>
              <h1 className="text-2xl mb-2 text-pink-900">Oops! Something went wrong</h1>
              <p className="text-pink-700 mb-4">
                We're sorry, but the app encountered an unexpected error.
              </p>
            </div>
            
            {this.state.error && (
              <div className="mb-4">
                <h2 className="font-semibold text-pink-900 mb-2">Error Details:</h2>
                <pre className="bg-pink-50 p-4 rounded-lg overflow-auto text-sm text-pink-800 border border-pink-200">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            
            {this.state.errorInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer font-semibold text-pink-900 mb-2">
                  Stack Trace (click to expand)
                </summary>
                <pre className="bg-pink-50 p-4 rounded-lg overflow-auto text-xs text-pink-700 border border-pink-200">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-pink-400 text-white py-3 rounded-xl hover:bg-pink-500 transition-all"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-pink-200 text-pink-900 py-3 rounded-xl hover:bg-pink-300 transition-all"
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
