"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import { parseEther } from "viem"
import { IMAGE_PAYMENT_CONTRACT_ADDRESS, IMAGE_FEE } from "@/lib/constants"
import { zodiacImagePaymentV3Abi } from "@/lib/abis"

interface ImagePaymentButtonProps {
  onPaymentSuccess: (paymentId: bigint, txHash: string) => void
  disabled?: boolean
}

export function ImagePaymentButton({ onPaymentSuccess, disabled }: ImagePaymentButtonProps) {
  const { address, isConnected } = useAccount()
  const [isProcessing, setIsProcessing] = useState(false)
  const publicClient = usePublicClient()

  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract()

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract paymentId from transaction receipt
  useEffect(() => {
    if (isConfirmed && receipt && hash && !isProcessing) {
      setIsProcessing(true)

      try {
        // Find the ImagePaymentReceived event in the logs
        const paymentEvent = receipt.logs.find((log: any) => {
          try {
            // Check if this log is from our contract
            if (log.address.toLowerCase() !== IMAGE_PAYMENT_CONTRACT_ADDRESS.toLowerCase()) {
              return false
            }
            // The ImagePaymentReceived event has the signature with paymentId as the second indexed parameter
            return log.topics.length >= 3
          } catch {
            return false
          }
        })

        if (paymentEvent && paymentEvent.topics[2]) {
          // paymentId is the second indexed parameter (topics[2])
          const paymentId = BigInt(paymentEvent.topics[2])
          console.log('[Payment] Extracted paymentId from receipt:', paymentId.toString())
          onPaymentSuccess(paymentId, hash)
        } else {
          console.warn('[Payment] Could not extract paymentId from receipt, using tx hash')
          // Fallback: use hash as identifier (will need backend processing)
          onPaymentSuccess(BigInt(0), hash)
        }
      } catch (error) {
        console.error('[Payment] Error extracting paymentId:', error)
        onPaymentSuccess(BigInt(0), hash)
      } finally {
        setIsProcessing(false)
      }
    }
  }, [isConfirmed, receipt, hash, isProcessing, onPaymentSuccess])

  const handlePayment = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first")
      return
    }

    try {
      setIsProcessing(true)

      // Call the contract using V3 ABI
      writeContract({
        address: IMAGE_PAYMENT_CONTRACT_ADDRESS,
        abi: zodiacImagePaymentV3Abi,
        functionName: "payForImage",
        value: parseEther(IMAGE_FEE),
      })
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
      setIsProcessing(false)
    }
  }

  const isLoading = isWritePending || isConfirming || isProcessing

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading || !isConnected}
      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg py-6 shadow-lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {isWritePending && "Confirm in Wallet..."}
          {isConfirming && "Processing Payment..."}
          {isProcessing && "Verifying..."}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Pay {IMAGE_FEE} CELO & Generate Image
        </>
      )}
    </Button>
  )
}
