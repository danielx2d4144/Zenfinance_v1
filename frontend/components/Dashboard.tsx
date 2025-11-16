"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import LendSection from "./LendSection";
import BorrowSection from "./BorrowSection";
import VaultsSection from "./VaultsSection";
import YieldSection from "./YieldSection";

export default function Dashboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"lend" | "borrow" | "vaults" | "yield">("lend");

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Connected: <span className="font-mono text-sm">{address}</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {[
          { id: "lend" as const, label: "Lend" },
          { id: "borrow" as const, label: "Borrow" },
          { id: "vaults" as const, label: "Vaults" },
          { id: "yield" as const, label: "Yield" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === tab.id
                ? "text-white border-b-2 border-primary-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === "lend" && <LendSection />}
        {activeTab === "borrow" && <BorrowSection />}
        {activeTab === "vaults" && <VaultsSection />}
        {activeTab === "yield" && <YieldSection />}
      </div>
    </div>
  );
}
