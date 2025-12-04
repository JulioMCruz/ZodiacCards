import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { SignJWT } from 'jose'

// Configure route timeout
export const maxDuration = 60

// Contract addresses (from environment variables)
const IMAGE_PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`

// Viem client for Celo
const publicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
})

// ABI for ZodiacImagePayment contract
const imagePaymentAbi = [
  {
    type: 'event',
    name: 'ImagePaymentReceived',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'paymentId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getPayment',
    stateMutability: 'view',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'imageS3Key', type: 'string' },
      { name: 'imageGenerated', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'payments',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'imageS3Key', type: 'string' },
      { name: 'imageGenerated', type: 'bool' },
    ],
  },
] as const

interface VerifyPaymentRequest {
  txHash: string
  userAddress: string
}

interface PaymentDetails {
  paymentId: number
  user: string
  amount: string
  timestamp: number
  verified: boolean
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 🔍 Payment Verification Started`)

  try {
    const body: VerifyPaymentRequest = await req.json()
    const { txHash, userAddress } = body

    if (!txHash || !userAddress) {
      return NextResponse.json(
        { error: 'Missing txHash or userAddress' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Verifying transaction: ${txHash}`)
    console.log(`[${requestId}] User address: ${userAddress}`)

    // Step 1: Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (receipt.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction failed' },
        { status: 400 }
      )
    }

    // Step 2: Verify transaction is to our payment contract
    if (receipt.to?.toLowerCase() !== IMAGE_PAYMENT_CONTRACT.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction not to payment contract' },
        { status: 400 }
      )
    }

    // Step 3: Verify sender matches user address
    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    })

    if (tx.from.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction sender does not match user address' },
        { status: 400 }
      )
    }

    // Step 4: Parse logs to get payment ID
    const logs = receipt.logs
    let paymentId: bigint | null = null
    let amount: bigint | null = null

    for (const log of logs) {
      try {
        if (log.address.toLowerCase() === IMAGE_PAYMENT_CONTRACT.toLowerCase()) {
          // Decode ImagePaymentReceived event
          const decodedLog = publicClient.decodeEventLog({
            abi: imagePaymentAbi,
            data: log.data,
            topics: log.topics,
          })

          if (decodedLog.eventName === 'ImagePaymentReceived') {
            const args = decodedLog.args as {
              user: string
              paymentId: bigint
              amount: bigint
              timestamp: bigint
            }

            paymentId = args.paymentId
            amount = args.amount
            console.log(`[${requestId}] Payment ID: ${paymentId}, Amount: ${amount}`)
            break
          }
        }
      } catch (error) {
        // Skip logs that don't match our event
        continue
      }
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'No payment event found in transaction' },
        { status: 400 }
      )
    }

    // Step 5: Verify payment on-chain
    const paymentData = await publicClient.readContract({
      address: IMAGE_PAYMENT_CONTRACT,
      abi: imagePaymentAbi,
      functionName: 'getPayment',
      args: [paymentId],
    }) as [string, bigint, bigint, string, boolean]

    const [contractUser, contractAmount, contractTimestamp, imageS3Key, imageGenerated] = paymentData

    // Verify user matches
    if (contractUser.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Payment user does not match' },
        { status: 400 }
      )
    }

    // Verify amount (should be >= 2 CELO)
    const minAmount = 2n * 10n ** 18n // 2 CELO in wei
    if (contractAmount < minAmount) {
      return NextResponse.json(
        { error: 'Insufficient payment amount' },
        { status: 400 }
      )
    }

    // Step 6: Generate access token (JWT)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    )

    const accessToken = await new SignJWT({
      userAddress: userAddress.toLowerCase(),
      paymentId: paymentId.toString(),
      txHash,
      amount: contractAmount.toString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Token valid for 24 hours
      .sign(secret)

    // Step 7: Store verification in database (you'll need to implement this)
    // TODO: Store in PostgreSQL using the schema from schema.sql
    // await db.paymentVerifications.insert({
    //   user_address: userAddress,
    //   payment_type: 'ImagePayment',
    //   tx_hash: txHash,
    //   block_number: receipt.blockNumber,
    //   payment_amount: contractAmount,
    //   contract_address: IMAGE_PAYMENT_CONTRACT,
    //   payment_id: paymentId,
    //   verification_status: 'verified',
    //   verification_timestamp: new Date(),
    //   access_token: accessToken,
    //   access_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    // })

    console.log(`[${requestId}] ✅ Payment verified successfully`)

    const paymentDetails: PaymentDetails = {
      paymentId: Number(paymentId),
      user: contractUser,
      amount: contractAmount.toString(),
      timestamp: Number(contractTimestamp),
      verified: true,
    }

    return NextResponse.json({
      verified: true,
      paymentDetails,
      accessToken,
      blockNumber: receipt.blockNumber.toString(),
      imageGenerated,
    })

  } catch (error: any) {
    console.error(`[${requestId}] ❌ Verification error:`, error)

    return NextResponse.json(
      {
        error: 'Payment verification failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check payment status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('paymentId')

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Missing paymentId parameter' },
      { status: 400 }
    )
  }

  try {
    // Read payment from contract
    const paymentData = await publicClient.readContract({
      address: IMAGE_PAYMENT_CONTRACT,
      abi: imagePaymentAbi,
      functionName: 'getPayment',
      args: [BigInt(paymentId)],
    }) as [string, bigint, bigint, string, boolean]

    const [user, amount, timestamp, imageS3Key, imageGenerated] = paymentData

    return NextResponse.json({
      paymentId: Number(paymentId),
      user,
      amount: amount.toString(),
      timestamp: Number(timestamp),
      imageS3Key,
      imageGenerated,
    })

  } catch (error: any) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment', details: error?.message },
      { status: 500 }
    )
  }
}
