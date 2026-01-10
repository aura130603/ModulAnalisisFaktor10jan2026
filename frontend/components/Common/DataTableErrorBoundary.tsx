// /components/Common/DataTableErrorBoundary.tsx
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

/**
 * Specialized error boundary for data table operations
 * Implements circuit breaker pattern for critical failures
 */
export class DataTableErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `dt_error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    console.error('DataTable Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Show user-friendly toast
    toast.error("Data Table Error: An error occurred while processing table data. Please try refreshing.");

    // Auto-retry for recoverable errors
    if (this.isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /indexeddb/i
    ];
    
    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    }, delay);
    
    this.retryTimeouts.push(timeout);
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  private handleReset = () => {
    // Force complete reset
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMaxRetriesReached = this.state.retryCount >= this.maxRetries;
      
      return (
        <div className="p-4 space-y-4" data-testid="data-table-error-boundary">
          <Alert variant="destructive" data-testid="data-table-error-alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle data-testid="data-table-error-title">Data Table Error</AlertTitle>
            <AlertDescription className="mt-2" data-testid="data-table-error-description">
              {this.state.error?.message || 'An unexpected error occurred while processing table data.'}
              <br />
              <span className="text-xs text-muted-foreground mt-1 block" data-testid="data-table-error-details">
                Error ID: {this.state.errorId} | Attempts: {this.state.retryCount}/{this.maxRetries}
              </span>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2" data-testid="data-table-error-actions">
            <Button 
              onClick={this.handleManualRetry}
              disabled={isMaxRetriesReached}
              variant="outline"
              size="sm"
              data-testid="data-table-retry-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isMaxRetriesReached ? 'Max Retries Reached' : 'Retry'}
            </Button>
            
            {isMaxRetriesReached && (
              <Button 
                onClick={this.handleReset}
                variant="destructive"
                size="sm"
                data-testid="data-table-reset-button"
              >
                Reset Application
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withDataTableErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <DataTableErrorBoundary>
      <Component {...(props as P)} ref={ref} />
    </DataTableErrorBoundary>
  ));
  
  WrappedComponent.displayName = `withDataTableErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};