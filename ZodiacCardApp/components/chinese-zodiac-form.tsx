"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2 } from "lucide-react"
import { getChineseZodiacSign } from "@/lib/zodiac-utils"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { SelfVerifyButton } from "@/components/self-verify-button"
import { IMAGE_FEE, IMAGE_PAYMENT_CONTRACT_ADDRESS } from "@/lib/constants"
import { useAccount, usePublicClient } from "wagmi"
import { parseEther } from "viem"
import { useContractInteraction } from "@/hooks/useContractInteraction"
import { SeasonalThemeSelector } from "@/components/seasonal-theme-selector"
import { type SeasonalTheme, getDefaultTheme } from "@/lib/seasonal-themes"

const IMAGE_PAYMENT_ABI = [
  {
    inputs: [],
    name: "payForImage",
    outputs: [{ internalType: "uint256", name: "paymentId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const

export function ChineseZodiacForm() {
  const router = useRouter()
  const { isAuthenticated, user } = useFarcaster()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { writeContract, waitForTransaction } = useContractInteraction()
  const [username, setUsername] = useState("")
  const [year, setYear] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [selectedTheme, setSelectedTheme] = useState<SeasonalTheme>(getDefaultTheme())

  // Auto-populate username from Farcaster context
  useEffect(() => {
    if (isAuthenticated && user?.username && !username) {
      setUsername(user.username)
    }
  }, [isAuthenticated, user, username])

  // Handle Self Protocol verification success
  const handleSelfVerification = (dateOfBirth: string) => {
    console.log('🎯 Self verification received:', dateOfBirth)
    // dateOfBirth format: "YYYY-MM-DD"
    const yearStr = dateOfBirth.split('-')[0]
    console.log('📅 Parsed year:', yearStr)
    setYear(yearStr)
    setError("") // Clear any errors
    console.log('✅ State updated successfully')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isConnected || !publicClient) {
      setError("Please connect your wallet first")
      return
    }

    if (!username || !year) {
      setError("Please fill in all fields")
      return
    }

    const yearNum = Number.parseInt(year)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setError("Please enter a valid birth year")
      return
    }

    setIsProcessing(true)
    try {
      const sign = getChineseZodiacSign(yearNum)

      // Execute payment transaction
      const hash = await writeContract({
        address: IMAGE_PAYMENT_CONTRACT_ADDRESS,
        abi: IMAGE_PAYMENT_ABI,
        functionName: "payForImage",
        args: [],
        value: parseEther(IMAGE_FEE),
      })

      // Wait for transaction confirmation
      await waitForTransaction(hash)

      // Navigate to result page with payment hash
      const params = new URLSearchParams({
        username,
        sign: sign.name,
        zodiacType: "chinese",
        paymentHash: hash,
        theme: selectedTheme,
      })
      router.push(`/result?${params.toString()}`)
    } catch (err) {
      console.error("Payment error:", err)
      const error = err as Error
      if (error.message.includes('user rejected') || error.message.includes('User rejected')) {
        setError("Transaction was rejected. Please try again.")
      } else {
        setError(error.message || "Payment failed. Please try again.")
      }
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Wallet Connection Notice */}
      {!isConnected && (
        <div className="p-4 rounded-lg bg-amber-100 border-2 border-amber-400">
          <p className="text-gray-800 text-sm font-medium text-center">
            ⚠️ Please connect your wallet using the button at the top right to continue
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-800">
          Farcaster Username
        </Label>
        <Input
          id="username"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-amber-50 border-amber-200 text-gray-800 placeholder:text-amber-400"
          readOnly={isAuthenticated}
          disabled={isAuthenticated}
        />
        <p className="text-xs text-gray-600">
          {isAuthenticated
            ? "Your Farcaster username (auto-filled)"
            : "Enter your Farcaster username without the @ symbol"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year" className="text-gray-800">
          Birth Year
        </Label>
        <Input
          id="year"
          type="password"
          inputMode="numeric"
          placeholder="YYYY"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-amber-50 border-amber-200 text-gray-800 placeholder:text-amber-400"
          autoComplete="off"
        />
        <p className="text-xs text-gray-600">Your Chinese zodiac sign will be determined by your birth year</p>
      </div>

      {/* Self Protocol verification button - only show in Farcaster environment */}
      {isAuthenticated && (
        <div className="space-y-2">
          <SelfVerifyButton
            onVerificationSuccess={handleSelfVerification}
            disabled={isProcessing}
            variant="amber"
          />
          <p className="text-xs text-gray-600 text-center">
            Verify your identity with Self Protocol to auto-fill your birth year
          </p>
        </div>
      )}

      {/* Seasonal Theme Selector */}
      <SeasonalThemeSelector
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium"
        disabled={isProcessing || !isConnected}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {`Reveal My Fortune (${IMAGE_FEE} CELO)`}
          </>
        )}
      </Button>

      {!isConnected && (
        <p className="text-amber-600 text-xs text-center font-medium">
          Please connect your wallet to continue
        </p>
      )}

      <p className="text-xs text-center text-gray-600">
        Your fortune will be generated using AI based on your Chinese zodiac sign
      </p>
    </form>
  )
}
