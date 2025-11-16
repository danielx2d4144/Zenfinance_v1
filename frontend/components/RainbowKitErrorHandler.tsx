"use client";

import { useEffect } from "react";

/**
 * This component handles RainbowKit initialization errors gracefully
 * by catching and suppressing expected errors without breaking the app
 */
export default function RainbowKitErrorHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Suppress RainbowKit projectId errors - they're warnings, not critical
    const originalError = console.error;
    console.error = function (...args: any[]) {
      const message = args.join(" ");
      if (
        message.includes("No projectId found") ||
        message.includes("RainbowKit") ||
        message.includes("@rainbow-me")
      ) {
        // Convert to warning instead of error
        console.warn(...args);
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return <>{children}</>;
}
