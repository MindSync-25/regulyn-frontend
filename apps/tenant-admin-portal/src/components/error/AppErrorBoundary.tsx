import { Component, ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Application-level error boundary
 * Catches React errors and displays fallback UI
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
