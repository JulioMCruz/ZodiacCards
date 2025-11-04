"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePublicClient } from "wagmi"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Loader2, ExternalLink, ArrowLeft } from "lucide-react"
import { zodiacNftAbi } from "@/lib/abis"

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as `0x${string}`
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "42220")
const NFT_EXPLORER_URL = TARGET_CHAIN_ID === 42220
  ? `https://celo.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`
  : `https://alfajores.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`

// Pinata gateway configuration
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export default function NFTDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.tokenId as string
  const publicClient = usePublicClient()
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNFTData() {
      if (!publicClient || !tokenId) return

      try {
        setIsLoading(true)

        // Fetch token URI
        const tokenURI = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: zodiacNftAbi,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)],
        }) as string

        // Fetch metadata from API endpoint
        const metadataResponse = await fetch(`/api/fetch-nft-metadata?uri=${encodeURIComponent(tokenURI)}`)

        if (metadataResponse.ok) {
          const data = await metadataResponse.json()
          setMetadata(data)
        } else {
          throw new Error('Failed to fetch NFT metadata')
        }
      } catch (err) {
        console.error('Error fetching NFT:', err)
        setError('Failed to load NFT')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFTData()
  }, [tokenId, publicClient])

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
        </div>
      </main>
    )
  }

  if (error || !metadata) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <p className="text-amber-200">{error || 'NFT not found'}</p>
          <Button onClick={() => router.push('/collection')} className="bg-amber-500 hover:bg-amber-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
        </div>
      </main>
    )
  }

  const imageUrl = metadata.image
    .replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
    .replace('https://ipfs.io/ipfs/', `${PINATA_GATEWAY}/ipfs/`)

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />

      <div className="w-full max-w-2xl mt-8 space-y-4">
        <Button
          onClick={() => router.push('/collection')}
          variant="ghost"
          className="text-amber-200 hover:bg-amber-900/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>

        <Card className="bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-amber-100">
              <Image
                src={imageUrl}
                alt={metadata.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{metadata.name}</h1>
                <p className="text-sm text-gray-500">Token ID: #{tokenId}</p>
              </div>

              {metadata.description && (
                <p className="text-gray-700 leading-relaxed">{metadata.description}</p>
              )}

              {metadata.attributes && metadata.attributes.length > 0 && (
                <div className="border-t border-amber-200 pt-4">
                  <h2 className="font-semibold text-gray-800 mb-3">Attributes</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.attributes.map((attr, idx) => (
                      <div key={idx} className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">{attr.trait_type}</p>
                        <p className="font-medium text-gray-800">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => window.open(`${NFT_EXPLORER_URL}/${tokenId}`, '_blank')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Blockscout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
