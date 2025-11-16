"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AssetDetailsView from "@/components/AssetDetailsView";
import { useParams } from "next/navigation";

export default function AssetDetailsPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  return (
    <main className="min-h-screen bg-[#0a0e27] flex flex-col">
      <Header />
      <div className="w-full py-8 flex-1">
        <AssetDetailsView assetSymbol={symbol.toUpperCase()} />
      </div>
      <Footer />
    </main>
  );
}


