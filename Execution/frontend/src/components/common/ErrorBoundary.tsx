'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tab component error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full bg-apex-dark text-white p-8">
            <div className="max-w-md">
              <div className="text-red-500 text-lg font-bold mb-2">Component Error</div>
              <div className="text-gray-400 text-sm mb-4">
                An error occurred while rendering this tab. Check the browser console for details.
              </div>
              {this.state.error && (
                <div className="bg-black/50 border border-red-500/30 rounded p-3 font-mono text-xs text-gray-300 break-words">
                  {this.state.error.message}
                </div>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
