/**
 * Error Boundary for MMQ Component
 *
 * Prevents errors from crashing the entire consuming app.
 * Shows a helpful fallback UI with recovery options.
 */

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class MMQErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MMQ Error Boundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="min-h-screen bg-background flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">⚠</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
            </div>

            <p className="text-sm text-muted-foreground">
              The MMQ component encountered an error. This could be due to:
            </p>

            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Network connectivity issues</li>
              <li>Invalid account number</li>
              <li>API endpoint unavailable</li>
              <li>Missing environment variables</li>
            </ul>

            {this.state.error && (
              <details className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              aria-label="Reload page to recover from error"
              className="w-full h-10 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
