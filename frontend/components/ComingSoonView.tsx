"use client";

import { Clock, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface ComingSoonViewProps {
  feature: string;
}

export default function ComingSoonView({ feature }: ComingSoonViewProps) {
  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm animate-fade-in">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-gradient-zen transition-colors duration-300"
        >
          Dashboard
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{feature}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{feature}</h1>
          <p className="text-gray-400">Coming soon to ZenFinance</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="max-w-2xl mx-auto mt-16">
        <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1422] rounded-2xl border border-white/10 p-12 text-center shadow-2xl">
          {/* Main Content */}
          <h2 className="text-3xl font-bold text-white mb-6">
            {feature} Coming Soon!
          </h2>
          
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            We're working hard to bring you innovative {feature.toLowerCase()} features. 
            Stay tuned for updates on this exciting new addition to the ZenFinance ecosystem.
          </p>

          {/* Feature Highlights */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">What to Expect</span>
            </div>
            <ul className="text-gray-300 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                High-yield staking opportunities
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                Validator-backed security
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                Automated reward distribution
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                Flexible staking periods
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Want to be notified when {feature.toLowerCase()} go live?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 hover-glow"
              >
                Explore Current Features
              </Link>
              <Link
                href="/markets"
                className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl transition-all duration-300"
              >
                View Markets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}