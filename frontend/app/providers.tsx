"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import RainbowKitErrorHandler from "@/components/RainbowKitErrorHandler";

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // 5 seconds - data is considered stale quickly
      gcTime: 60000, // 1 minute cache time
    },
  },
});

// Export queryClient for use in hooks
export { queryClient };

// ZenChain Testnet Configuration
const zenChainTestnet = defineChain({
  id: 8408,
  name: "ZenChain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ZTC",
    symbol: "ZTC",
  },
  rpcUrls: {
    default: {
      http: ["https://zenchain-testnet.api.onfinality.io/public"],
    },
    public: {
      http: ["https://zenchain-testnet.api.onfinality.io/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "ZenTrace",
      url: "https://zentrace.io",
    },
  },
  testnet: true,
});

const { connectors } = getDefaultWallets({
  appName: "ZenFinance",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "zenfinance-app",
});

const config = createConfig({
  chains: [zenChainTestnet],
  connectors,
  transports: {
    [zenChainTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RainbowKitErrorHandler>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            appInfo={{
              appName: "ZenFinance",
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </RainbowKitErrorHandler>
  );
}
