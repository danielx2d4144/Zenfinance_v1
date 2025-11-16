"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Check if error is from Chrome extension or WalletConnect
    const isExpectedError =
      error.message?.includes("chrome.runtime.sendMessage") ||
      error.message?.includes("Extension ID") ||
      error.stack?.includes("chrome-extension://") ||
      error.message?.includes("Connection interrupted while trying to subscribe") ||
      error.stack?.includes("@walletconnect") ||
      error.stack?.includes("@reown") ||
      error.message?.includes("Failed to fetch remote project configuration");

    if (isExpectedError) {
      // Silently suppress expected errors and reset
      reset();
      return;
    }

    // Log actual errors
    console.error("Application error:", error);
  }, [error, reset]);

  // Check if this is an expected error (extension or WalletConnect)
  const isExpectedError =
    error.message?.includes("chrome.runtime.sendMessage") ||
    error.message?.includes("Extension ID") ||
    error.stack?.includes("chrome-extension://") ||
    error.message?.includes("Connection interrupted while trying to subscribe") ||
    error.stack?.includes("@walletconnect") ||
    error.stack?.includes("@reown") ||
    error.message?.includes("Failed to fetch remote project configuration");

  // Don't show error UI for expected errors
  if (isExpectedError) {
    return null;
  }

  // Show error UI for actual application errors
  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4">
      <div className="bg-white/5 rounded-xl p-8 border border-white/10 max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">
          <span className="text-white">Something went</span>{" "}
          <span className="text-gradient-zen">wrong!</span>
        </h2>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white rounded-lg transition-all duration-300 hover-glow"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
