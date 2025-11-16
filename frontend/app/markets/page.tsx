"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketsView from "@/components/MarketsView";

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#0a0e27] flex flex-col">
      <Header />
      <div className="w-full py-8 flex-1">
        <MarketsView />
      </div>
      <Footer />
    </main>
  );
}
