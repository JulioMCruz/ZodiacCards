"use client"

import { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Loader2, Sparkles, ExternalLink } from "lucide-react"
import { zodiacNftAbi } from "@/lib/abis"
import { NFTShareButton } from "@/components/nft-share-button"

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as `0x${string}`
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "42220")
const NFT_EXPLORER_URL = TARGET_CHAIN_ID === 42220
  ? `https://celo.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`
  : `https://alfajores.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`

const BLOCKSCOUT_API_URL = TARGET_CHAIN_ID === 42220
  ? 'https://celo.blockscout.com/api'
  : 'https://alfajores.blockscout.com/api'

// Pinata gateway configuration
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

interface NFT {
  tokenId: string
  tokenURI: string
  mintedDate?: number
  metadata?: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string
    }>
  }
}

export default function CollectionPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setNfts([])
      return
    }

    const fetchNFTs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch all NFT transfers for this address from Blockscout (1 API call total)
        let mintDatesMap: { [tokenId: string]: number } = {}
        try {
          const apiUrl = `${BLOCKSCOUT_API_URL}?module=account&action=tokennfttx&contractaddress=${CONTRACT_ADDRESS}&address=${address}&page=1&offset=100&sort=asc`
          const response = await fetch(apiUrl)
          const data = await response.json()

          if (data.status === '1' && Array.isArray(data.result)) {
            // Build a map of tokenId -> mint timestamp
            data.result.forEach((tx: any) => {
              if (tx.from === '0x0000000000000000000000000000000000000000' && tx.timeStamp) {
                mintDatesMap[tx.tokenID] = parseInt(tx.timeStamp) * 1000
              }
            })
          }
        } catch (err) {
          console.error('Failed to fetch mint dates from Blockscout:', err)
        }

        // Get the next token ID to know the range of tokens to check
        const nextTokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: zodiacNftAbi,
          functionName: 'nextTokenId',
        }) as bigint

        const totalTokens = Number(nextTokenId)

        if (totalTokens === 0) {
          setNfts([])
          setIsLoading(false)
          return
        }

        // Check each token to see if the user owns it
        const nftPromises: Promise<NFT | null>[] = []

        for (let tokenId = 0; tokenId < totalTokens; tokenId++) {
          const promise = (async () => {
            try {
              const owner = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: zodiacNftAbi,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)],
              }) as `0x${string}`

              // Check if this token belongs to the current user
              if (owner.toLowerCase() !== address.toLowerCase()) {
                return null
              }

              const tokenURI = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: zodiacNftAbi,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)],
              }) as string

              // Get mint date from the map we built earlier
              const mintedDate = mintDatesMap[tokenId.toString()]

              // Fetch metadata using server-side API for better logging and reliability
              let metadata
              try {
                console.log(`[Collection] Fetching metadata for token ${tokenId}, URI:`, tokenURI)

                const metadataResponse = await fetch('/api/fetch-nft-metadata', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tokenURI })
                })

                if (metadataResponse.ok) {
                  const data = await metadataResponse.json()
                  metadata = data.metadata
                  console.log(`[Collection] ✅ Metadata loaded for token ${tokenId} via gateway:`, data.gateway)
                } else {
                  const errorData = await metadataResponse.json().catch(() => ({}))
                  console.error(`[Collection] ❌ Failed to fetch metadata for token ${tokenId}:`, errorData)

                  // Fallback: try direct client-side fetch with Pinata gateway
                  console.log(`[Collection] 🔄 Trying client-side fallback for token ${tokenId}`)
                  const ipfsHash = tokenURI.replace('ipfs://', '')
                  const fallbackUrl = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`

                  try {
                    const fallbackResponse = await fetch(fallbackUrl, { cache: 'force-cache' })
                    if (fallbackResponse.ok) {
                      metadata = await fallbackResponse.json()
                      console.log(`[Collection] ✅ Fallback succeeded for token ${tokenId}`)
                    }
                  } catch (fallbackErr) {
                    console.error(`[Collection] ❌ Fallback also failed for token ${tokenId}:`, fallbackErr)
                  }
                }
              } catch (err) {
                console.error(`[Collection] ❌ Unexpected error fetching metadata for token ${tokenId}:`, err)
              }

              return {
                tokenId: tokenId.toString(),
                tokenURI,
                mintedDate,
                metadata,
              }
            } catch (err) {
              // Token might not exist yet or other error
              return null
            }
          })()

          nftPromises.push(promise)
        }

        const fetchedNFTs = await Promise.all(nftPromises)
        const userNFTs = fetchedNFTs.filter((nft): nft is NFT => nft !== null)

        // Sort by mint date - newest first
        userNFTs.sort((a, b) => {
          if (!a.mintedDate && !b.mintedDate) return 0
          if (!a.mintedDate) return 1
          if (!b.mintedDate) return -1
          return b.mintedDate - a.mintedDate
        })

        setNfts(userNFTs)
      } catch (err) {
        console.error('Error fetching NFTs:', err)
        setError('Failed to load your collection. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFTs()
  }, [address, isConnected, publicClient])

  const handleViewOnBlockscout = (tokenId: string) => {
    const url = `${NFT_EXPLORER_URL}/${tokenId}`
    window.open(url, '_blank')
  }

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
                Please connect your wallet to view your Zodiac Card collection.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />

      <div className="w-full max-w-6xl mt-8">
        <h1 className="text-3xl font-bold text-amber-300 mb-2 text-center">
          My Collection
        </h1>
        <p className="text-violet-200 text-center mb-8">
          Your minted Zodiac Card NFTs
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
            <p className="text-violet-200">Loading your collection...</p>
          </div>
        ) : error ? (
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="p-8 text-center">
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        ) : nfts.length === 0 ? (
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-16 w-16 text-amber-300 mb-4" />
              <h2 className="text-2xl font-bold text-amber-300 mb-2">No NFTs Yet</h2>
              <p className="text-violet-200 mb-4">
                You haven't minted any Zodiac Cards yet. Start your cosmic journey!
              </p>
              <Link href="/">
                <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mint Your First Card
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <Card
                key={nft.tokenId}
                className="bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-0">
                  {nft.metadata?.image ? (
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-amber-100">
                      <Image
                        src={
                          nft.metadata.image
                            .replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
                            .replace('https://ipfs.io/ipfs/', `${PINATA_GATEWAY}/ipfs/`)
                        }
                        alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                        onError={(e) => {
                          console.error('[Collection] Image failed to load:', nft.metadata?.image)
                          // Try alternative gateways in order
                          const target = e.target as HTMLImageElement
                          const currentSrc = target.src

                          if (currentSrc.includes('pinata')) {
                            console.log('[Collection] Trying cloudflare gateway')
                            const hash = nft.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://cloudflare-ipfs.com/ipfs/${hash}`
                          } else if (currentSrc.includes('cloudflare')) {
                            console.log('[Collection] Trying dweb gateway')
                            const hash = nft.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://dweb.link/ipfs/${hash}`
                          } else if (currentSrc.includes('dweb')) {
                            console.log('[Collection] Trying ipfs.io gateway')
                            const hash = nft.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://ipfs.io/ipfs/${hash}`
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-200 to-amber-200 flex items-center justify-center">
                      <Sparkles className="h-16 w-16 text-amber-600 opacity-50" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-gray-800 mb-1">
                      {nft.metadata?.name || `Zodiac Card #${nft.tokenId}`}
                    </h3>

                    {nft.metadata?.description && (
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {nft.metadata.description}
                      </p>
                    )}

                    {nft.mintedDate && (
                      <p className="text-xs text-gray-500">
                        Minted: {new Date(nft.mintedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}

                    {nft.metadata?.attributes && (
                      <div className="space-y-1 pt-2 border-t border-amber-200">
                        {nft.metadata.attributes.map((attr, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            <span className="font-medium">{attr.trait_type}:</span> {attr.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <NFTShareButton
                    tokenId={nft.tokenId}
                    name={nft.metadata?.name || `Zodiac Card #${nft.tokenId}`}
                    description={nft.metadata?.description}
                    imageUrl={
                      nft.metadata.image
                        .replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
                        .replace('https://ipfs.io/ipfs/', `${PINATA_GATEWAY}/ipfs/`)
                    }
                    attributes={nft.metadata?.attributes}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleViewOnBlockscout(nft.tokenId)}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Blockscout
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
