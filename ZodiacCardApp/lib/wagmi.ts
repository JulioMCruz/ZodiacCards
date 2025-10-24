import { http, createConfig } from 'wagmi'
import { celo, celoAlfajores, base, baseSepolia } from 'wagmi/chains'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'
import { injected, walletConnect } from 'wagmi/connectors'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "44787")

// Select the appropriate chain based on the chain ID
const targetChain = TARGET_CHAIN_ID === 42220 ? celo : celoAlfajores

// Create transports object with proper typing for all chains
// Include Base chains since Farcaster wallets often connect to Base by default
const transports = {
  [celo.id]: http(),
  [celoAlfajores.id]: http(),
  [base.id]: http(),
  [baseSepolia.id]: http(),
} as const

// WalletConnect project ID is required for WalletConnect v2
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined')
}

// Configure chain-specific settings
const chainConfig = {
  [celo.id]: {
    ...celo,
    rpcUrls: {
      ...celo.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL_CELO || 'https://forno.celo.org'] },
    }
  },
  [celoAlfajores.id]: {
    ...celoAlfajores,
    rpcUrls: {
      ...celoAlfajores.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL_CELO_ALFAJORES || 'https://alfajores-forno.celo-testnet.org'] },
    }
  }
}

// Use the chain config for the target chain
const configuredChain = chainConfig[targetChain.id]

// Include all chains to allow switching from Farcaster's default Base network to Celo
export const config = createConfig({
  chains: [configuredChain, base, baseSepolia],
  transports,
  connectors: [
    miniAppConnector(),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'Zodiac Card',
        description: 'Mint your personalized Zodiac Card NFT',
        url: process.env.NEXT_PUBLIC_SITE_URL || '',
        icons: [process.env.NEXT_PUBLIC_IMAGE_URL || ''],
      },
    }),
  ]
}) 