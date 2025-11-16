"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Filter out Chrome extension errors and WalletConnect errors
    const errorMessage = error.message || "";
    const errorStack = error.stack || "";
    
    if (
      errorMessage.includes("chrome.runtime.sendMessage") ||
      errorMessage.includes("Extension ID") ||
      errorStack.includes("chrome-extension://") ||
      errorMessage.includes("Connection interrupted while trying to subscribe") ||
      errorMessage.includes("No projectId found") ||
      errorMessage.includes("Failed to fetch remote project configuration") ||
      errorStack.includes("@walletconnect") ||
      errorStack.includes("@reown") ||
      errorStack.includes("@rainbow-me")
    ) {
      // Don't show error boundary for these expected errors
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out Chrome extension errors and WalletConnect errors
    const errorMessage = error.message || "";
    const errorStack = error.stack || "";
    
    if (
      errorMessage.includes("chrome.runtime.sendMessage") ||
      errorMessage.includes("Extension ID") ||
      errorStack.includes("chrome-extension://") ||
      errorMessage.includes("Connection interrupted while trying to subscribe") ||
      errorMessage.includes("No projectId found") ||
      errorMessage.includes("Failed to fetch remote project configuration") ||
      errorStack.includes("@walletconnect") ||
      errorStack.includes("@reown") ||
      errorStack.includes("@rainbow-me")
    ) {
      // Silently ignore these expected errors
      return;
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4">
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 max-w-md animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-4">
              <span className="text-white">Something went</span>{" "}
              <span className="text-gradient-zen">wrong</span>
            </h1>
            <p className="text-gray-400 mb-6">
              An error occurred. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white rounded-lg transition-all duration-300 hover-glow"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
