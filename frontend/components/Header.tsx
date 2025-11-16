"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, ArrowLeftRight, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/markets", label: "Markets" },
    { href: "/transactions", label: "Transactions" },
    { href: "https://faucet.zenchain.io/", label: "Faucet", external: true },
    { href: "/v-pools", label: "V-Pools" },
    { href: "/staking", label: "Staking" },
  ];

  return (
    <>
      <header className="relative border-b border-white/10 bg-[#0a0e27] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left Side - Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group -ml-2">
            <span className="text-lg font-medium transition-all duration-300 group-hover:scale-105">
              <span className="text-white">Zen</span>
              <span className="bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 bg-clip-text text-transparent font-semibold animate-gradient">
                Finance
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5 hover:border-transparent border border-transparent hover-glow"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive(link.href)
                      ? "text-white bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 border border-green-400/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-transparent"
                  } border border-transparent hover-glow`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Swap Button - Hidden on mobile */}
            <a 
              href="https://zenswap.zenchain.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 hover:from-yellow-400/20 hover:via-green-400/20 hover:to-cyan-400/20 text-white rounded-lg transition-all duration-300 border border-green-400/20 hover:border-green-400/40 hover-glow"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Swap
            </a>
            
            {/* Connect Button */}
            <div className="flex items-center">
              <ConnectButton />
            </div>
            
            {/* Settings - Hidden on small mobile */}
            <button className="hidden sm:block p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:border-green-400/30 border border-transparent">
              <Settings className="w-5 h-5 text-gray-400 hover:text-green-400 transition-colors duration-300" />
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] z-40 bg-[#0a0e27]/95 backdrop-blur-lg">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-2">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5 text-lg"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 text-lg ${
                    isActive(link.href)
                      ? "text-white bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 border border-green-400/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            
            {/* Mobile-only actions */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <a 
                href="https://zenswap.zenchain.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 text-white rounded-lg border border-green-400/20"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Swap
              </a>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-white/10 rounded-lg text-gray-400">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
