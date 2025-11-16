"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Footer from "@/components/Footer";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    } else {
      router.push("/markets");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-[#0a0e27] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 via-green-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-green-500/50 transition-all duration-300 animate-pulse-glow">
            Z
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            <span className="text-white">Zen</span>
            <span className="text-gradient-zen">Finance</span>
          </h1>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
