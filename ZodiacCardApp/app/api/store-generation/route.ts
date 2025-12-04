import { NextResponse } from 'next/server'
import { createWalletClient, http, parseAbi } from 'viem'
import { celo } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const maxDuration = 60

const IMAGE_PAYMENT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
const RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org'

// Simple ABI for storeGeneration function
const contractAbi = parseAbi([
  'function storeGeneration(uint256 paymentId, string metadataURI) external',
  'function payments(uint256) view returns (address user, uint256 amount, uint256 timestamp, string imageS3Key, bool imageGenerated)',
])

interface StoreGenerationRequest {
  paymentId: number
  metadataURI: string
  userAddress: string
}

export async function POST(req: Request) {
  try {
    const body: StoreGenerationRequest = await req.json()
    const { paymentId, metadataURI, userAddress } = body

    console.log('[Store Generation] Request:', {
      paymentId,
      metadataURI: metadataURI.substring(0, 50) + '...',
      userAddress,
    })

    // Validate required fields
    if (!paymentId || !metadataURI || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!PRIVATE_KEY) {
      console.error('[Store Generation] Private key not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create wallet client with server's private key
    const account = privateKeyToAccount(PRIVATE_KEY)
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(RPC_URL),
    })

    console.log('[Store Generation] Calling contract from:', account.address)

    // Call storeGeneration on behalf of the user
    const hash = await walletClient.writeContract({
      address: IMAGE_PAYMENT_CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'storeGeneration',
      args: [BigInt(paymentId), metadataURI],
    })

    console.log('[Store Generation] Transaction hash:', hash)

    return NextResponse.json({
      success: true,
      transactionHash: hash,
    })

  } catch (error: any) {
    console.error('[Store Generation] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to store generation on-chain',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
