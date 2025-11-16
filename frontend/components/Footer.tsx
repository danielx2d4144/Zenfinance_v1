"use client";

import Link from "next/link";
import { Twitter, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0e27] mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Side - Navigation Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline"
            >
              Privacy
            </Link>
            <a
              href="https://drive.google.com/drive/folders/1zNRpAkxZb4pEpYr-XoJcAmOcd2NdZ0bm?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline"
            >
              Docs
            </a>
            <Link
              href="/support"
              className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline"
            >
              Get Support
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeA-AJ_BRYzPkBv3omzM9OlSVpFZ8Ugvvimzwrck4YY50F4qA/viewform?usp=sharing&ouid=113711754020006482504"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline"
            >
              Report a bug
            </a>
          </div>

          {/* Right Side - Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/zenfinance_defi?t=qK3Z2wgfHQJ0To2eUsQ6Gg&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://discord.gg/yChtAwRzjA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:scale-110"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/zenfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

