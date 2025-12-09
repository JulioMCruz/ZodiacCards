"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodiacData } from "@/lib/zodiac-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Share2 } from "lucide-react"
import { Header } from "@/components/header"
import { MintButton } from "@/components/mint-button"
import { ZodiacLoading } from "@/components/zodiac-loading"
import { useAccount, usePublicClient } from "wagmi"
import { parseEther } from "viem"
import { IMAGE_FEE, IMAGE_PAYMENT_CONTRACT_ADDRESS } from "@/lib/constants"
import { sdk } from "@farcaster/miniapp-sdk"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { useContractInteraction } from "@/hooks/useContractInteraction"
import { zodiacImagePaymentV3Abi } from "@/lib/abis"
import { type SeasonalTheme, buildSeasonalPrompt, getThemeById } from "@/lib/seasonal-themes"

export default function ResultPage() {

  // console.log('ResultPage')

  const searchParams = useSearchParams()
  const { address } = useAccount()
  const { isAuthenticated } = useFarcaster()
  const publicClient = usePublicClient()
  const { writeContract, waitForTransaction } = useContractInteraction()
  const username = searchParams.get("username") || ""
  const sign = searchParams.get("sign") || ""
  const zodiacType = searchParams.get("zodiacType") || ""
  const paymentHash = searchParams.get("paymentHash") || "" // Payment transaction hash
  const selectedTheme = (searchParams.get("theme") as SeasonalTheme) || 'regular'

  // Single ref to track generation state
  const generationStateRef = useRef({
    hasStarted: false,
    fortuneGenerated: false,
    imageGenerated: false,
    storedOnChain: false
  })

  const [fortune, setFortune] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasGeneratedFortune, setHasGeneratedFortune] = useState(false)
  const [generationId, setGenerationId] = useState<number | null>(null)
  const [metadataURI, setMetadataURI] = useState<string | null>(null)
  const [isUploadingShare, setIsUploadingShare] = useState(false)

  // Payment is already done when arriving at this page
  const hasPaid = !!paymentHash

  // Get zodiac info
  const zodiacInfo = zodiacData[zodiacType as keyof typeof zodiacData]
  const signInfo = zodiacInfo?.signs.find((s) => s.name === sign) ||
    zodiacInfo?.signs.find((s) => s.name.includes(sign)) || { name: sign, element: "Unknown", symbol: "" }

  // Store generation on-chain (replaces database save)
  async function storeOnChain() {
    if (!address || !fortune || !imageUrl || !paymentHash) {
      console.log('Missing required data for on-chain storage:', { address, fortune: !!fortune, imageUrl: !!imageUrl, paymentHash: !!paymentHash })
      return
    }

    if (generationStateRef.current.storedOnChain) return

    try {
      console.log('📦 Uploading metadata to IPFS...')

      // 1. Upload metadata to IPFS
      const metadataResponse = await fetch('/api/upload-generation-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fortuneText: fortune,
          imageUrl,
          zodiacType,
          zodiacSign: sign,
          paymentTxHash: paymentHash,
          paymentAmount: IMAGE_FEE,
          username: username || '',
          description: `A unique Zodiac fortune for ${username || 'you'}.`,
          theme: selectedTheme,
          themeInfo: getThemeById(selectedTheme),
        }),
      })

      const metadataData = await metadataResponse.json()

      if (!metadataResponse.ok || !metadataData.ipfsUri) {
        console.error('Failed to upload metadata to IPFS:', metadataData.error)
        return
      }

      const ipfsUri = metadataData.ipfsUri
      console.log('✅ Metadata uploaded to IPFS:', ipfsUri)

      // Store metadataURI in state for MintButton
      setMetadataURI(ipfsUri)

      // 2. Extract paymentId from payment transaction receipt
      if (!publicClient) {
        console.error('No public client available')
        return
      }

      const receipt = await publicClient.getTransactionReceipt({ hash: paymentHash as `0x${string}` })

      // Find the ImagePaymentReceived event
      const paymentEvent = receipt.logs.find((log: any) => {
        try {
          if (log.address.toLowerCase() !== IMAGE_PAYMENT_CONTRACT_ADDRESS.toLowerCase()) {
            return false
          }
          return log.topics.length >= 3
        } catch {
          return false
        }
      })

      if (!paymentEvent || !paymentEvent.topics[2]) {
        console.error('Could not extract paymentId from transaction receipt')
        return
      }

      const paymentId = BigInt(paymentEvent.topics[2])
      console.log('✅ Extracted paymentId:', paymentId.toString())

      // 3. Call backend API to store generation on-chain (server pays gas)
      console.log('💾 Storing generation on-chain...')

      const storeResponse = await fetch('/api/store-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: Number(paymentId),
          metadataURI: ipfsUri,
          userAddress: address,
        }),
      })

      const storeData = await storeResponse.json()

      if (!storeResponse.ok) {
        console.error('Failed to store generation on-chain:', storeData.error)
        throw new Error(storeData.error || 'Failed to store generation')
      }

      console.log('✅ Generation stored on-chain:', storeData.transactionHash)

      generationStateRef.current.storedOnChain = true
      setGenerationId(Number(paymentId)) // Store as number for compatibility
      console.log(`✅ Generation stored on-chain with paymentId: ${paymentId}`)

    } catch (err) {
      console.error('Error storing generation on-chain:', err)
      // Don't show error to user, this is a background operation
    }
  }

  useEffect(() => {
    // Only proceed if we have payment confirmation
    if (!hasPaid) {
      setIsLoading(false)
      setError("Payment required to generate your fortune and image")
      return
    }

    async function generateFortune() {
      if (!username || !sign || !zodiacType) {
        setIsLoading(false)
        setError("Missing required information")
        return
      }

      if (generationStateRef.current.fortuneGenerated) return

      try {
        const response = await fetch("/api/generate-fortune", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            sign,
            zodiacType,
          }),
        })

        const data = await response.json()

        if (response.ok && data.fortune) {
          setFortune(data.fortune)
          generationStateRef.current.fortuneGenerated = true
        } else {
          setFortune(
            `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your natural ${signInfo.element} energy will guide you to make wise investment choices. Trust your intuition this week.`,
          )
          generationStateRef.current.fortuneGenerated = true
        }
      } catch (apiError) {
        console.error("API error:", apiError)
        setFortune(
          `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your natural ${signInfo.element} energy will guide you to make wise investment choices. Trust your intuition this week.`,
        )
        generationStateRef.current.fortuneGenerated = true
      }
    }

    async function generateImage() {
      if (!username || !sign || !zodiacType) {
        setError("Missing required information")
        return
      }

      if (generationStateRef.current.imageGenerated) return

      try {

        //const prompt = `This digital artwork blends anime and cosmic art to depict a mystical character and a mistical animal what symbolize the  ${sign} embodying the zodiac ${zodiacType}, intertwined with base blockchain themes. The character boasts flowing blue and turquoise hair, large ${sign} caracteristics adorned with starry constellations, and a glowing base blockchain symbol floating beside the character, while the character holds a radiant base blockchain symbol that illuminates the character's robe, all set against an enchanting starry backdrop.`
        

        const basePrompt = `Style: Semi-realistic anime art, mystical fantasy illustration, elegant cosmic art. Mature anime aesthetic with detailed shading and ethereal lighting. NOT chibi, NOT kawaii, NOT cartoonish, NOT photorealistic.

Create a stunning digital artwork featuring TWO mystical subjects that MUST both be visible: (1) an elegant female anime character and (2) her magical spirit animal companion, both representing ${sign} of the ${zodiacType} zodiac.

The FIRST SUBJECT is a beautiful, elegant female anime character with a mystical and ethereal presence. She has detailed, sophisticated feminine facial features with flowing hair in shades of celestial blue and turquoise, adorned with glowing constellation patterns of ${sign}. Her elegant robes shimmer with cosmic energy and radiant light, featuring intricate ${zodiacType} zodiac symbols woven into the fabric with luminous fine detail. Her expressive eyes reflect the wisdom of the stars, and she holds a glowing blockchain symbol that pulses with ethereal golden energy. The character should have a graceful, mature feminine appearance with detailed shading, highlights, and magical luminescence.

The SECOND SUBJECT is a majestic magical spirit animal companion that embodies the essence of ${sign}. This is NOT a normal animal - it is a mystical, supernatural creature that glows with cosmic energy and stellar light. The spirit animal appears prominently beside or near the character, its body radiating with brilliant ethereal energy, glowing auras, and shimmering stardust. Its form is partially translucent and composed of constellation lines, cosmic particles, and magical light effects. The animal has elegant proportions with glowing mystical features - luminous eyes, radiant fur/skin/feathers, and ethereal energy trails. It should look supernatural and magical, not realistic or normal.

Both figures are surrounded by a mesmerizing cosmic backdrop featuring swirling nebulae in deep purples and blues, with blockchain mystical constellation patterns appearing among the stars. The composition creates a harmonious balance between the character, their spirit animal, and celestial elements, all unified by the mystical energy of ${sign}.

The artwork should maintain a perfect balance between anime aesthetics, zodiac mysticism, and blockchain cosmic symbolism, creating a captivating and meaningful representation of ${sign}'s spiritual energy in the digital age.`

        // Apply seasonal theme modifiers
        const prompt = buildSeasonalPrompt(basePrompt, selectedTheme)

        console.log(`🎨 Initiating image generation with theme: ${selectedTheme}`)
        
        const imageResponse = await fetch(process.env.NEXT_PUBLIC_IMAGE_GENERATION_URL || "", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        // console.log('📡 Image generation response status:', imageResponse.status)
        // console.log('📡 Response headers:', Object.fromEntries(imageResponse.headers.entries()))

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text()
          console.error('❌ Image generation failed:', {
            status: imageResponse.status,
            statusText: imageResponse.statusText,
            responseBody: errorText
          })
          throw new Error(`Failed to generate image: ${imageResponse.status} ${imageResponse.statusText}`)
        }

        const imageData = await imageResponse.json()
        console.log('✅ Image generation successful, URL received:', imageData.imageUrl ? 'Yes' : 'No')

        if (!imageData.imageUrl) {
          throw new Error('No image URL returned')
        }

        // Upload the generated image to S3
        try {
          const uploadResponse = await fetch(process.env.NEXT_PUBLIC_S3_UPLOAD_URL || "", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: imageData.imageUrl,
              username,
              sign,
              zodiacType,
            }),
          })

          if (uploadResponse.ok) {
            const { s3Url } = await uploadResponse.json()
            if (s3Url) {
              setImageUrl(s3Url)
            } else {
              setImageUrl(imageData.imageUrl) // Fallback to original URL
            }
          } else {
            console.warn('Failed to upload to S3, using original URL')
            setImageUrl(imageData.imageUrl) // Fallback to original URL
          }
        } catch (uploadError) {
          console.error('Error uploading to S3:', uploadError)
          setImageUrl(imageData.imageUrl) // Fallback to original URL
        }

        generationStateRef.current.imageGenerated = true
      } catch (err) {
        console.error("Failed to generate image:", err)
        setError("Failed to generate your character image. Please try again.")
      }
    }

    async function initializeContent() {
      if (generationStateRef.current.hasStarted) return

      try {
        generationStateRef.current.hasStarted = true
        setIsLoading(true)

        // Generate fortune first
        await generateFortune()
        setHasGeneratedFortune(true)

        // If payment was made, generate image automatically
        if (hasPaid) {
          await generateImage()
          // Database save will be triggered by the useEffect when imageUrl is set
        }
      } catch (err) {
        console.error("Error in generation process:", err)
        setError("Failed to complete the generation process. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    initializeContent()

    return () => {
      // No need to reset the ref on cleanup as we want to preserve the generation state
    }
  }, [username, sign, zodiacType, signInfo.element, hasPaid])

  // Store on-chain when both fortune and imageUrl are ready
  useEffect(() => {
    if (address && fortune && imageUrl && paymentHash && !generationStateRef.current.storedOnChain) {
      storeOnChain()
    }
  }, [address, fortune, imageUrl, paymentHash])

  const handleShare = async () => {
    // Build share text
    let text = `Just revealed my Zodiac fortune! ✨\n\nZodiac: ${zodiacType.toUpperCase()}\nSign: ${sign}\n${fortune}\n\nCheck Zodiac Cards 🌟`

    let shareImageUrl = imageUrl

    // Upload image to S3 first to get a reliable URL for Farcaster
    if (imageUrl) {
      try {
        setIsUploadingShare(true)
        console.log('[Share] Uploading image to S3 for sharing')

        const uploadResponse = await fetch('/api/upload-nft-share-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            tokenId: generationId?.toString() || 'temp',
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
        setIsUploadingShare(false)
      }
    }

    if (isAuthenticated) {
      // In Farcaster app - use SDK with embeds
      try {
        const embeds: string[] = []

        // Add S3 image URL if available
        if (shareImageUrl) {
          embeds.push(shareImageUrl)
        }

        // Add app link
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
      // In browser - open Farcaster compose URL
      const encodedText = encodeURIComponent(text)
      const embedsParam = shareImageUrl
        ? `&embeds[]=${encodeURIComponent(shareImageUrl)}&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
        : `&embeds[]=${encodeURIComponent("https://zodiaccard.xyz")}`
      window.open(`https://warpcast.com/~/compose?text=${encodedText}${embedsParam}`, '_blank')
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mt-8">
          <ZodiacLoading className="w-full h-96 bg-white/5 backdrop-blur-md border border-amber-300/20 rounded-lg" />
        </div>
      </main>
    )
  }

  if (error || !zodiacInfo) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-amber-300/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-red-300 mb-4">{error || "Something went wrong. Please try again."}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />
      <div className="w-full max-w-md mb-2 md:mb-6">
        <Link href="/">
          <Button variant="ghost" className="text-amber-200 hover:bg-amber-900/20">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Zodiac Selection
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden">
        <div className="relative h-32 w-full">
          <Image
            src={zodiacInfo.image || "/placeholder.svg"}
            alt={zodiacInfo.name}
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F5E6C8]"></div>
        </div>

        <CardHeader className="text-center pt-2">
          <CardTitle className="text-2xl font-bold text-gray-800">
            <span className="text-amber-700">{username}</span>'s Fortune
          </CardTitle>
          <CardDescription className="text-gray-600">
            {zodiacInfo.emoji} {zodiacInfo.name}: {signInfo.name} {'symbol' in signInfo ? signInfo.symbol : ''}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {/* Show loading state during image generation */}
          {!imageUrl && !error && (
            <div className="mb-6 w-full aspect-square rounded-lg overflow-hidden">
              <ZodiacLoading message="Creating your character..." className="w-full h-full bg-amber-50/50 border border-amber-200" />
            </div>
          )}

          {/* Show generated image */}
          {imageUrl && (
            <div className="mb-6 overflow-hidden">
              <div className="relative w-full aspect-square max-w-[400px] mx-auto rounded-xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`Generated character for ${username}'s ${zodiacType} ${sign}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-gray-800 text-lg italic">{fortune}</p>
          </div>

          <p className="text-gray-600 text-sm">Generated on {new Date().toLocaleDateString()}</p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">

          <MintButton
            username={username}
            zodiacSign={sign}
            fortune={fortune}
            zodiacType={zodiacType}
            imageUrl={imageUrl || ""}
            paymentId={generationId || undefined}
            metadataURI={metadataURI || undefined}
          />

          <Button
            onClick={handleShare}
            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium"
            disabled={isUploadingShare}
          >
            {isUploadingShare ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share on Farcaster
              </>
            )}
          </Button>

          <Link href={`/`} className="w-full">
            <Button variant="outline" className="w-full border-amber-300 text-amber-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Another
            </Button>
          </Link>

        </CardFooter>
      </Card>
    </main>
  )
}
