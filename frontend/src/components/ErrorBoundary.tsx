/**
 * @fileoverview Error Boundary component
 * 
 * React Error Boundary for catching and displaying
 * JavaScript errors in the component tree.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error | undefined
  errorInfo?: ErrorInfo | undefined
}

/**
 * Error Boundary component
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // TODO: Log error to monitoring service
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2 className="error-title">Oops! Something went wrong</h2>
          <p className="error-message">
            We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                backgroundColor: '#f7fafc', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0'
              }}>
                <strong>Error:</strong> {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    <br /><br />
                    <strong>Stack Trace:</strong>
                    <br />
                    {this.state.error.stack}
                  </>
                )}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong>
                    <br />
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={this.handleRetry}
              className="btn btn-primary"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}