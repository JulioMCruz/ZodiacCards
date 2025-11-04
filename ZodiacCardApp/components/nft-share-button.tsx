"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Loader2 } from "lucide-react"
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
  const [isUploading, setIsUploading] = useState(false)

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

    let shareImageUrl = imageUrl

    // Upload image to S3 first to get a reliable URL for Farcaster
    if (imageUrl) {
      try {
        setIsUploading(true)
        console.log('[Share] Uploading image to S3 for token:', tokenId)

        const uploadResponse = await fetch('/api/upload-nft-share-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            tokenId,
          }),
        })

        if (uploadResponse.ok) {
          const { s3Url } = await uploadResponse.json()
          if (s3Url) {
            shareImageUrl = s3Url
            console.log('[Share] Successfully uploaded to S3:', s3Url)
          } else {
            console.warn('[Share] No S3 URL returned, using original image URL')
          }
        } else {
          console.warn('[Share] Failed to upload to S3, using original image URL')
        }
      } catch (uploadError) {
        console.error('[Share] Error uploading to S3:', uploadError)
        console.log('[Share] Falling back to original image URL')
      } finally {
        setIsUploading(false)
      }
    }

    if (isAuthenticated) {
      // In Farcaster app - use SDK with embeds
      try {
        const embeds: string[] = []

        if (shareImageUrl) {
          embeds.push(shareImageUrl)
        }

        embeds.push("https://zodiaccard.xyz")

        console.log('[Share] Sharing with embeds:', embeds)

        await sdk.actions.composeCast({
          text,
          embeds,
        })
      } catch (error) {
        console.error('Error sharing with SDK:', error)
        // Fallback to web URL
        const encodedText = encodeURIComponent(text)
        const embedsParam = shareImageUrl
          ? `&embeds[]=${encodeURIComponent(shareImageUrl)}&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
          : `&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
        window.open(`https://warpcast.com/~/compose?text=${encodedText}${embedsParam}`, '_blank')
      }
    } else {
      // In browser - open Warpcast compose URL
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
      disabled={isUploading}
    >
      {isUploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing...
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </>
      )}
    </Button>
  )
}
