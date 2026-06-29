import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-card/50 to-background p-4 md:p-8">
          <div className="max-w-md w-full bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected crash occurred. Try resetting the cache and returning home.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="w-full text-left bg-destructive/5 border border-destructive/10 rounded-2xl p-4 overflow-auto max-h-48 text-[10px] font-mono text-destructive">
                <div className="font-bold mb-1">Error: {this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="whitespace-pre-wrap leading-normal opacity-80">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <Button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-full py-6 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset App & Return Home
            </Button>
          </div>
        </div>
      );
    }

    return this.state.children;
  }
}
