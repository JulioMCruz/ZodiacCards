"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Loader2, Copy, Check } from "lucide-react"
import { SelfAppBuilder, getUniversalLink, type SelfApp } from "@selfxyz/qrcode"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { sdk } from "@farcaster/miniapp-sdk"
import { useAccount } from "wagmi"

interface SelfVerifyButtonProps {
  onVerificationSuccess: (dateOfBirth: string) => void
  disabled?: boolean
  variant?: "violet" | "amber"
}

export function SelfVerifyButton({ onVerificationSuccess, disabled, variant = "violet" }: SelfVerifyButtonProps) {
  const { isAuthenticated } = useFarcaster()
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [mounted, setMounted] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Self app
  useEffect(() => {
    if (!address) return

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Zodiac Card",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "zodiac-card-app",
        endpoint: `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-self`,
        callbackUrl: typeof window !== 'undefined' ? window.location.href : '',
        logoBase64: process.env.NEXT_PUBLIC_SELF_LOGO_URL || "",
        userId: address,
        endpointType: "https", // HTTPS endpoint for verification
        userIdType: "hex", // Ethereum address
        userDefinedData: JSON.stringify({
          timestamp: Date.now(),
          source: "zodiac-card-app"
        }),
        disclosures: {
          // Verification requirements
          minimumAge: 13, // Minimum age for zodiac card
          ofac: false,
          excludedCountries: [],
          // Request date of birth disclosure
          date_of_birth: true
        }
      }).build()

      setSelfApp(app)
    } catch (err) {
      console.error("Failed to initialize Self app:", err)
      setError("Failed to initialize Self Protocol")
    }
  }, [address])

  const copyToClipboard = () => {
    if (!selfApp) return

    const universalLink = getUniversalLink(selfApp)
    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy text:", err)
        setError("Failed to copy link")
      })
  }

  const handleVerify = async () => {
    if (!selfApp || !address) {
      setError("Please connect your wallet first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const universalLink = getUniversalLink(selfApp)

      console.log('🔗 Generated Self deeplink:', universalLink)
      console.log('📍 Verification endpoint:', `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-self`)
      console.log('👤 User address:', address)

      if (isAuthenticated) {
        // In Farcaster app - open with SDK
        try {
          await sdk.actions.openUrl(universalLink)

          // Poll for verification result
          // In production, you'd use a websocket or webhook to get the result
          const pollForResult = setInterval(async () => {
            try {
              // Check if verification completed
              const response = await fetch('/api/verify-self/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: address })
              })

              const data = await response.json()

              if (data.verified && data.date_of_birth) {
                clearInterval(pollForResult)
                setIsLoading(false)
                onVerificationSuccess(data.date_of_birth)
              }
            } catch (err) {
              console.error('Polling error:', err)
            }
          }, 2000) // Poll every 2 seconds

          // Stop polling after 5 minutes
          setTimeout(() => {
            clearInterval(pollForResult)
            setIsLoading(false)
          }, 300000)

        } catch (err) {
          console.error('Error opening Self app with SDK:', err)
          // Fallback to window.open
          window.open(universalLink, '_blank')
        }
      } else {
        // In browser - open in new tab
        window.open(universalLink, '_blank')
        setIsLoading(false)
      }

    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  const buttonStyles = variant === "amber"
    ? "w-full border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-950"
    : "w-full border-violet-300/50 bg-white/10 hover:bg-white/20 text-white"

  const textStyles = variant === "amber" ? "text-amber-950" : "text-violet-300"
  const errorStyles = variant === "amber" ? "text-red-600" : "text-red-300"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleVerify}
          disabled={disabled || isLoading || !address}
          variant="outline"
          className={`flex-1 ${buttonStyles}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying with Self...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Get Info from Self Protocol
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={copyToClipboard}
          disabled={disabled || !address || !selfApp}
          variant="outline"
          className={`px-3 ${buttonStyles}`}
          title="Copy verification link"
        >
          {linkCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p className={`text-xs ${errorStyles}`}>{error}</p>
      )}

      {!address && (
        <p className={`text-xs ${textStyles}`}>
          Connect your wallet to verify with Self Protocol
        </p>
      )}
    </div>
  )
}
