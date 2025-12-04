// Contract addresses on Celo Mainnet
export const IMAGE_PAYMENT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`
export const IMAGE_PAYMENT_CONTRACT_ADDRESS_V2 = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS_V2 as `0x${string}` | undefined
export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`

// Payment fees (in CELO, 18 decimals)
export const IMAGE_FEE = process.env.NEXT_PUBLIC_IMAGE_FEE || "2.0"
export const NFT_MINT_FEE = process.env.NEXT_PUBLIC_CELO_MINT_PRICE || "2.0"

// Network configuration
export const CELO_CHAIN_ID = 42220 // Celo Mainnet
export const CELO_RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org"
