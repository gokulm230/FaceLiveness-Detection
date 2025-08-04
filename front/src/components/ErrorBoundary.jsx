import React from 'react';
import { motion } from 'motion/react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <motion.div 
            className="error-boundary-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="error-icon">
              <FiAlertTriangle size={48} />
            </div>
            
            <h1>Something went wrong</h1>
            
            <p>
              We're sorry, but something unexpected happened. The face detection system 
              encountered an error and couldn't continue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= 3}
              >
                <FiRefreshCw size={16} />
                Try Again
                {this.state.retryCount > 0 && ` (${this.state.retryCount}/3)`}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            <div className="error-help">
              <h3>What can you do?</h3>
              <ul>
                <li>Check your internet connection</li>
                <li>Ensure your browser supports WebRTC and camera access</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser</li>
                {this.state.error?.message?.includes('useRoutes') && (
                  <li className="error-specific">Router configuration error - please reload the page</li>
                )}
                {this.state.error?.message?.includes('camera') && (
                  <li className="error-specific">Camera access denied - please allow camera permissions</li>
                )}
              </ul>
            </div>

            <div className="error-support">
              <p>
                If the problem persists, please contact technical support with the 
                error information above.
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
