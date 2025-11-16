"use client";

import { useEffect } from "react";

export default function ExtensionErrorSuppressor() {
  useEffect(() => {
    // Only run on client after mount
    if (typeof window === "undefined") return;

    // Suppress Chrome extension errors and WalletConnect errors
    const originalError = window.console.error;
    window.console.error = function (...args: any[]) {
      const message = args.join(" ");
      const shouldSuppress =
        message.includes("chrome.runtime.sendMessage") ||
        message.includes("Extension ID") ||
        message.includes("chrome-extension://") ||
        message.includes("[Reown Config] Failed to fetch") ||
        message.includes("Failed to fetch remote project configuration") ||
        message.includes("No projectId found") ||
        args.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("chrome.runtime.sendMessage") ||
              arg.includes("Extension ID") ||
              arg.includes("chrome-extension://") ||
              arg.includes("[Reown Config]") ||
              arg.includes("No projectId found"))
        );

      if (shouldSuppress) {
        // Silently suppress - these are expected errors in development
        return;
      }
      originalError.apply(console, args);
    };

    // Intercept errors before Next.js overlay
    const originalOnerror = window.onerror;
    window.onerror = function (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) {
      const messageStr = String(message || "");
      const sourceStr = String(source || "");
      const errorStack = error?.stack || "";
      if (
        messageStr.includes("chrome.runtime.sendMessage") ||
        messageStr.includes("Extension ID") ||
        sourceStr.includes("chrome-extension://") ||
        messageStr.includes("Connection interrupted while trying to subscribe") ||
        messageStr.includes("No projectId found") ||
        errorStack.includes("@walletconnect") ||
        errorStack.includes("@reown") ||
        errorStack.includes("@rainbow-me") ||
        messageStr.includes("Failed to fetch remote project configuration")
      ) {
        return true; // Prevent default error handling
      }
      if (originalOnerror) {
        return originalOnerror.call(
          this,
          message,
          source,
          lineno,
          colno,
          error
        );
      }
      return false;
    };

    // Intercept unhandled rejections
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message = reason?.message || String(reason || "");
      const stack = reason?.stack || "";
      const reasonStr = String(reason || "");

      const shouldSuppress =
        message.includes("chrome.runtime.sendMessage") ||
        message.includes("Extension ID") ||
        stack.includes("chrome-extension://") ||
        reasonStr.includes("chrome.runtime.sendMessage") ||
        message.includes("Connection interrupted while trying to subscribe") ||
        message.includes("No projectId found") ||
        stack.includes("@walletconnect") ||
        stack.includes("@reown") ||
        stack.includes("@rainbow-me");

      if (shouldSuppress) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Silently suppress - these are expected errors
        return true;
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    // Intercept regular errors
    const handleError = (e: ErrorEvent) => {
      const errorStack = (e.error as Error)?.stack || "";
      if (
        e.message &&
        (e.message.includes("chrome.runtime.sendMessage") ||
          e.message.includes("Extension ID") ||
          e.filename?.includes("chrome-extension://") ||
          e.message.includes("Connection interrupted while trying to subscribe") ||
          errorStack.includes("@walletconnect") ||
          errorStack.includes("@reown") ||
          e.message.includes("Failed to fetch remote project configuration"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };
    window.addEventListener("error", handleError, true);

    // Cleanup function
    return () => {
      window.console.error = originalError;
      window.onerror = originalOnerror;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return null; // This component doesn't render anything
}
