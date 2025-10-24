"use client"

import React from "react"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

// Create QueryClient at module level (official Farcaster Mini App pattern)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

// Create a simple context for wallet connection state
export const WalletContext = React.createContext({
  isConnected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
})

// Wagmi provider with QueryClient (Farcaster official template pattern)
// IMPORTANT: WagmiProvider must wrap QueryClientProvider for Wagmi v2
export function WagmiConfig({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

