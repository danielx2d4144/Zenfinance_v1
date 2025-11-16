"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardView from "@/components/DashboardView";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0a0e27] flex flex-col">
        <Header />
        <div className="w-full py-8 flex-1">
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-white/10 max-w-md">
              <h1 className="text-4xl font-bold text-white mb-4 text-center">
                Welcome to ZenFinance
              </h1>
              <p className="text-gray-400 text-lg mb-8 text-center">
                Connect your wallet to start lending, borrowing, and earning on ZenChain Testnet
              </p>
              <div className="flex justify-center w-full">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0e27] flex flex-col">
      <Header />
      <div className="w-full py-8 flex-1">
        {isConnected ? (
          <DashboardView />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 sm:p-12 shadow-2xl border border-white/10 max-w-md w-full">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 text-center">
                Welcome to ZenFinance
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mb-8 text-center">
                Connect your wallet to start lending, borrowing, and earning on ZenChain Testnet
              </p>
              <div className="flex justify-center w-full">
                <ConnectButton />
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-6 text-center">
                Or use the Connect Wallet button in the header
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
