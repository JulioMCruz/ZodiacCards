"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

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
  const handleShare = () => {
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

    text += `\n\nCheck out ZodiacCards on Base 🌟`

    // Create the Warpcast URL with embeds
    let url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`

    // Add image and app URL as embeds
    if (imageUrl) {
      url += `&embeds[]=${encodeURIComponent(imageUrl)}`
    }
    url += `&embeds[]=${encodeURIComponent('https://zodiaccard.xyz')}`

    // Open in new window
    window.open(url, "_blank")
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
