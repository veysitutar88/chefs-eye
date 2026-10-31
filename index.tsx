import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthShell } from './components/AuthShell';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
          <p className="mb-4 text-sm opacity-80">Please refresh the page. Local drafts will be retained.</p>
          <pre className="bg-red-100 p-4 rounded text-xs overflow-auto max-w-full text-left">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload (drafts retained)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("index.tsx: Starting application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthShell />
    </ErrorBoundary>
  </React.StrictMode>
);