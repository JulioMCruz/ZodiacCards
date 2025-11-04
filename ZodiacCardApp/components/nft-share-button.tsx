"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { sdk } from "@farcaster/miniapp-sdk"
import { useFarcaster } from "@/contexts/FarcasterContext"

interface NFTShareButtonProps {
  tokenId: string
  name: string
  description?: string
  imageUrl?: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
  className?: string
}

export function NFTShareButton({
  tokenId,
  name,
  description,
  imageUrl,
  attributes,
  className
}: NFTShareButtonProps) {
  const { isAuthenticated } = useFarcaster()

  const handleShare = async () => {
    // Build share text with NFT details
    let text = `✨ ${name}\n\n${description || ''}`

    // Add key attributes if available
    if (attributes && attributes.length > 0) {
      const attributeText = attributes
        .slice(0, 3) // Limit to first 3 attributes to keep text concise
        .map(attr => `${attr.trait_type}: ${attr.value}`)
        .join(' | ')
      text += `\n\n${attributeText}`
    }

    text += `\n\nCheck Zodiac Cards 🌟`

    // Use cloudflare gateway to avoid rate limiting
    const shareImageUrl = imageUrl
      ? imageUrl
          .replace('https://gateway.pinata.cloud/ipfs/', 'https://cloudflare-ipfs.com/ipfs/')
          .replace('https://ipfs.io/ipfs/', 'https://cloudflare-ipfs.com/ipfs/')
      : undefined

    console.log('[Share] Original image URL:', imageUrl)
    console.log('[Share] Share image URL (cloudflare):', shareImageUrl)

    if (isAuthenticated) {
      // In Farcaster app - use SDK with embeds
      try {
        await sdk.actions.composeCast({
          text,
          embeds: shareImageUrl ? [shareImageUrl, "https://zodiaccard.xyz"] : ["https://zodiaccard.xyz"],
        })
      } catch (error) {
        console.error('Error sharing with SDK:', error)
        // Fallback to web URL with embeds in URL
        const encodedText = encodeURIComponent(text)
        const embedsParam = shareImageUrl
          ? `&embeds[]=${encodeURIComponent(shareImageUrl)}&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
          : `&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
        window.open(`https://warpcast.com/~/compose?text=${encodedText}${embedsParam}`, '_blank')
      }
    } else {
      // In browser - open Warpcast compose URL with embeds
      const encodedText = encodeURIComponent(text)
      const embedsParam = shareImageUrl
        ? `&embeds[]=${encodeURIComponent(shareImageUrl)}&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
        : `&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
      window.open(`https://warpcast.com/~/compose?text=${encodedText}${embedsParam}`, '_blank')
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className={`border-amber-300 text-amber-700 hover:bg-amber-50 ${className}`}
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share
    </Button>
  )
}
