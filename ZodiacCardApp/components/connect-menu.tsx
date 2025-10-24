"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown, SwitchCamera } from "lucide-react"
import { cn } from "@/lib/utils"
import { truncateEthAddress } from "@/lib/utils"
import { sdk } from "@farcaster/miniapp-sdk"
import { useFarcaster } from "@/contexts/FarcasterContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { celo, celoAlfajores } from 'wagmi/chains'

export function ConnectMenu() {
  const [mounted, setMounted] = useState(false)
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get target chain from env - CELO NETWORK
  const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "42220")
  const targetChain = TARGET_CHAIN_ID === 42220 ? celo : celoAlfajores
  const NETWORK_NAME = targetChain.name

  useEffect(() => {
    setMounted(true)
  }, [])

  // Call all hooks unconditionally (Rules of Hooks requirement)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { isAuthenticated, user } = useFarcaster()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()

  // Auto-connect in Farcaster environment
  useEffect(() => {
    const autoConnect = async () => {
      if (mounted && isAuthenticated && !isConnected) {
        console.log('🔗 Auto-connecting Farcaster wallet...')
        try {
          const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
          if (farcasterConnector) {
            await connect({ connector: farcasterConnector })
            console.log('✅ Auto-connected successfully')
          }
        } catch (error) {
          console.error('❌ Auto-connect failed:', error)
        }
      }
    }
    autoConnect()
  }, [mounted, isAuthenticated, isConnected, connectors, connect])

  // Check if we're on the wrong network and auto-switch if needed
  useEffect(() => {
    if (isConnected) {
      const wrongNetwork = chainId !== TARGET_CHAIN_ID
      setIsWrongNetwork(wrongNetwork)

      if (wrongNetwork) {
        // Auto-switch to Celo on connection
        const autoSwitch = async () => {
          try {
            setError(`Switching to ${NETWORK_NAME}...`)
            await switchChain({ chainId: TARGET_CHAIN_ID })
            setError(null)
          } catch (switchError) {
            console.error('Failed to auto-switch network:', switchError)
            setError(`Please switch to ${NETWORK_NAME}`)
          }
        }
        autoSwitch()
      } else {
        setError(null)
      }
    } else {
      setIsWrongNetwork(false)
      setError(null)
    }
  }, [chainId, isConnected, TARGET_CHAIN_ID, NETWORK_NAME, switchChain])

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      setError(null)
      await switchChain({ chainId: TARGET_CHAIN_ID })
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError(`Failed to switch to ${NETWORK_NAME}. Please try manually.`)
    }
  }

  // Don't render anything on the server
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700"
        disabled
      >
        <Wallet className="h-4 w-4" />
      </Button>
    )
  }

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isWrongNetwork ? "destructive" : "outline"}
              className={cn(
                isWrongNetwork ? "animate-pulse" : "bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700",
                "min-w-[160px] justify-between"
              )}
            >
              <div className="flex items-center">
                <Wallet className="mr-2 h-4 w-4" />
                {isWrongNetwork ? (
                  <>Wrong Network</>
                ) : isAuthenticated && user?.username ? (
                  `@${user.username}`
                ) : (
                  address ? truncateEthAddress(address) : 'Connected'
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {isWrongNetwork && (
              <DropdownMenuItem
                className="text-violet-600 focus:text-violet-700 cursor-pointer"
                onClick={handleSwitchNetwork}
                disabled={isSwitchPending}
              >
                <SwitchCamera className={cn("mr-2 h-4 w-4", isSwitchPending && "animate-spin")} />
                {isSwitchPending ? 'Switching...' : `Switch to ${NETWORK_NAME}`}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => disconnect()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {error && (
          <p className="text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }

  const handleConnect = async () => {
    try {
      setError(null)

      if (isAuthenticated) {
        // In Farcaster environment, use farcasterMiniApp connector
        const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
        if (!farcasterConnector) throw new Error('Farcaster connector not found')
        await connect({ connector: farcasterConnector })
      } else {
        // In web environment, try injected or WalletConnect
        const injectedConnector = connectors.find(c => c.id === 'injected')
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')

        if (injectedConnector && window.ethereum) {
          await connect({ connector: injectedConnector })
        } else if (walletConnectConnector) {
          await connect({ connector: walletConnectConnector })
        } else {
          throw new Error('No suitable wallet connector found')
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setError('Failed to connect wallet. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleConnect}
        className={cn(
          "bg-violet-600 hover:bg-violet-700",
          "text-white",
          "flex items-center gap-2"
        )}
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
      {error && (
        <p className="text-sm text-red-500 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  )
} 