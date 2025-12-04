"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useAccount, usePublicClient } from "wagmi"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Loader2, ArrowLeft, Sparkles } from "lucide-react"
import { zodiacImagePaymentV3Abi } from "@/lib/abis"
import { IMAGE_PAYMENT_CONTRACT_ADDRESS } from "@/lib/constants"
import { MintButton } from "@/components/mint-button"
import Link from "next/link"

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

interface GenerationMetadata {
  fortuneText: string
  imageUrl: string
  zodiacType: string
  zodiacSign: string
  username?: string
  description?: string
}

export default function MintPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const paymentId = params.id as string
  const username = searchParams.get("username") || ""
  const sign = searchParams.get("sign") || ""
  const zodiacType = searchParams.get("zodiacType") || ""

  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null)
  const [metadataURI, setMetadataURI] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMinted, setIsMinted] = useState(false)

  useEffect(() => {
    async function fetchGenerationData() {
      if (!publicClient || !paymentId) return

      try {
        setIsLoading(true)

        // Fetch generation data from contract
        const generation = await publicClient.readContract({
          address: IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`,
          abi: zodiacImagePaymentV3Abi,
          functionName: 'getGeneration',
          args: [BigInt(paymentId)],
        }) as {
          metadataURI: string
          tokenId: bigint
          isMinted: boolean
          createdAt: bigint
          mintedAt: bigint
        }

        console.log('[Mint] Generation data:', generation)
        console.log('[Mint] Metadata URI from contract:', generation.metadataURI)
        console.log('[Mint] Is already minted:', generation.isMinted)

        // Store metadataURI for minting
        setMetadataURI(generation.metadataURI)

        // Check if already minted
        if (generation.isMinted) {
          console.log('[Mint] ⚠️ This generation is already minted, showing message')
          setIsMinted(true)
          setIsLoading(false)
          return
        }

        // Fetch metadata from IPFS
        if (generation.metadataURI) {
          const metadataUrl = generation.metadataURI.replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
          console.log('[Mint] Fetching metadata from:', metadataUrl)
          const response = await fetch(metadataUrl)
          const data = await response.json()

          console.log('[Mint] Metadata loaded:', data)
          setMetadata(data)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('[Mint] Error fetching generation:', err)
        setError('Failed to load generation data')
        setIsLoading(false)
      }
    }

    fetchGenerationData()
  }, [publicClient, paymentId])

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mt-8">
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-16 w-16 text-amber-300 mb-4" />
              <h2 className="text-2xl font-bold text-amber-300 mb-2">Connect Your Wallet</h2>
              <p className="text-violet-200">
                Please connect your wallet to mint your Zodiac Card NFT.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-amber-300 animate-spin" />
          <p className="text-violet-200 mt-4">Loading your fortune...</p>
        </div>
      </main>
    )
  }

  if (isMinted) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="w-full max-w-md mt-8">
          <Link href="/collection">
            <Button variant="ghost" className="text-violet-200 hover:text-amber-300 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collection
            </Button>
          </Link>
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-16 w-16 text-amber-300 mb-4" />
              <h2 className="text-2xl font-bold text-amber-300 mb-2">Already Minted!</h2>
              <p className="text-violet-200 mb-4">
                This fortune has already been minted as an NFT.
              </p>
              <Link href="/collection">
                <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950">
                  View Collection
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (error || !metadata) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="w-full max-w-md mt-8">
          <Link href="/collection">
            <Button variant="ghost" className="text-violet-200 hover:text-amber-300 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collection
            </Button>
          </Link>
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="p-8 text-center">
              <p className="text-red-300">{error || 'No metadata found'}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />

      <div className="w-full max-w-2xl mt-8">
        <Link href="/collection">
          <Button variant="ghost" className="text-violet-200 hover:text-amber-300 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
        </Link>

        <Card className="bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#D97706' }}>
                {username || 'Your'}'s Fortune
              </h1>
              <p className="text-gray-700 flex items-center justify-center gap-2">
                🐉 {metadata.zodiacType} Zodiac: {metadata.zodiacSign}
              </p>
            </div>

            {/* Image */}
            <div className="relative w-full aspect-square mb-6 rounded-lg overflow-hidden">
              <Image
                src={metadata.imageUrl}
                alt={`${metadata.zodiacType} - ${metadata.zodiacSign}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Fortune Text */}
            <div className="bg-white/50 rounded-lg p-4 mb-6">
              <p className="text-gray-800 italic leading-relaxed text-center">
                {metadata.fortuneText}
              </p>
            </div>

            {/* Mint Button */}
            <MintButton
              paymentId={Number(paymentId)}
              username={username}
              sign={sign}
              zodiacType={zodiacType}
              fortuneText={metadata.fortuneText}
              imageUrl={metadata.imageUrl}
              metadataURI={metadataURI || undefined}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
