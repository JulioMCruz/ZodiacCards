"use client"

import { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Header } from "@/components/header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, ExternalLink } from "lucide-react"
import { zodiacNftAbi, zodiacImagePaymentV3Abi } from "@/lib/abis"
import { NFTShareButton } from "@/components/nft-share-button"
import { ShareButton } from "@/components/share-button"
import { CollectionLoading } from "@/components/collection-loading"
import { IMAGE_PAYMENT_CONTRACT_ADDRESS, IMAGE_PAYMENT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS_V2 } from "@/lib/constants"

// Contract configuration
const CONTRACT_ADDRESS = NFT_CONTRACT_ADDRESS // V3 contract
const CONTRACT_ADDRESS_V2 = NFT_CONTRACT_ADDRESS_V2 // V2 contract (legacy)
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "42220")
const NFT_EXPLORER_URL = TARGET_CHAIN_ID === 42220
  ? `https://celo.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`
  : `https://alfajores.blockscout.com/token/${CONTRACT_ADDRESS.toLowerCase()}/instance`

const BLOCKSCOUT_API_URL = TARGET_CHAIN_ID === 42220
  ? 'https://celo.blockscout.com/api'
  : 'https://alfajores.blockscout.com/api'

// Pinata gateway configuration - ensure it has https:// protocol
const PINATA_GATEWAY_RAW = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
const PINATA_GATEWAY = PINATA_GATEWAY_RAW.startsWith('http')
  ? PINATA_GATEWAY_RAW
  : `https://${PINATA_GATEWAY_RAW}`

interface NFT {
  tokenId: string
  tokenURI: string
  mintedDate?: number
  contractAddress: string // Track which contract this NFT is from
  metadata?: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string
    }>
  }
  type: 'minted'
}

interface GeneratedFortune {
  id: number
  zodiacType: string
  zodiacSign: string
  fortuneText: string
  imageUrl: string
  createdAt: string
  username?: string
  description?: string
  metadataURI?: string
  type: 'generated'
}

type CollectionItem = NFT | GeneratedFortune

export default function CollectionPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [items, setItems] = useState<CollectionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setItems([])
      return
    }

    const fetchCollection = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[Collection] Fetching collection for address:', address)

        // Fetch generated fortunes from smart contracts (V3 and V2)
        const generatedItems: GeneratedFortune[] = []

        // Query V3 contract (current)
        try {
          console.log('[Collection] Fetching from V3 contract:', IMAGE_PAYMENT_CONTRACT_ADDRESS)

          const result = await publicClient.readContract({
            address: IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`,
            abi: zodiacImagePaymentV3Abi,
            functionName: 'getUserCollection',
            args: [address as `0x${string}`],
          }) as [bigint[], Array<{
            metadataURI: string
            tokenId: bigint
            isMinted: boolean
            createdAt: bigint
            mintedAt: bigint
          }>]

          const [paymentIds, generationData] = result

          console.log('[Collection] Found', paymentIds.length, 'generations from V3 contract')

          // Filter only Generated items (not already minted)
          for (let i = 0; i < paymentIds.length; i++) {
            const gen = generationData[i]

            if (!gen.isMinted && gen.metadataURI) {
              // Fetch metadata from IPFS
              try {
                const metadataUrl = gen.metadataURI.replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
                const metadataResponse = await fetch(metadataUrl)
                const metadata = await metadataResponse.json()

                generatedItems.push({
                  id: Number(paymentIds[i]),
                  zodiacType: metadata.zodiacType || 'Unknown',
                  zodiacSign: metadata.zodiacSign || 'Unknown',
                  fortuneText: metadata.fortuneText || '',
                  imageUrl: metadata.imageUrl || '',
                  createdAt: new Date(Number(gen.createdAt) * 1000).toISOString(),
                  username: metadata.username || metadata.name || '',
                  description: metadata.description || '',
                  metadataURI: gen.metadataURI,
                  type: 'generated'
                })
              } catch (metadataError) {
                console.error('[Collection] Error fetching metadata for V3 payment', paymentIds[i], metadataError)
              }
            }
          }

          console.log('[Collection] Loaded', generatedItems.length, 'generated items from V3 contract')
        } catch (err) {
          console.error('[Collection] Error fetching from V3 contract:', err)
        }

        // Query V2 contract (legacy) if available
        if (IMAGE_PAYMENT_CONTRACT_ADDRESS_V2) {
          try {
            console.log('[Collection] Fetching from V2 contract:', IMAGE_PAYMENT_CONTRACT_ADDRESS_V2)

            const resultV2 = await publicClient.readContract({
              address: IMAGE_PAYMENT_CONTRACT_ADDRESS_V2 as `0x${string}`,
              abi: zodiacImagePaymentV3Abi,
              functionName: 'getUserCollection',
              args: [address as `0x${string}`],
            }) as [bigint[], Array<{
              metadataURI: string
              tokenId: bigint
              isMinted: boolean
              createdAt: bigint
              mintedAt: bigint
            }>]

            const [paymentIdsV2, generationDataV2] = resultV2

            console.log('[Collection] Found', paymentIdsV2.length, 'generations from V2 contract')

            // Filter only Generated items (not already minted)
            for (let i = 0; i < paymentIdsV2.length; i++) {
              const gen = generationDataV2[i]

              if (!gen.isMinted && gen.metadataURI) {
                // Fetch metadata from IPFS
                try {
                  const metadataUrl = gen.metadataURI.replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
                  const metadataResponse = await fetch(metadataUrl)
                  const metadata = await metadataResponse.json()

                  generatedItems.push({
                    id: Number(paymentIdsV2[i]),
                    zodiacType: metadata.zodiacType || 'Unknown',
                    zodiacSign: metadata.zodiacSign || 'Unknown',
                    fortuneText: metadata.fortuneText || '',
                    imageUrl: metadata.imageUrl || '',
                    createdAt: new Date(Number(gen.createdAt) * 1000).toISOString(),
                    username: metadata.username || metadata.name || '',
                    description: metadata.description || '',
                    metadataURI: gen.metadataURI,
                    type: 'generated'
                  })
                } catch (metadataError) {
                  console.error('[Collection] Error fetching metadata for V2 payment', paymentIdsV2[i], metadataError)
                }
              }
            }

            console.log('[Collection] Loaded total', generatedItems.length, 'generated items (V3 + V2)')
          } catch (err) {
            console.error('[Collection] Error fetching from V2 contract:', err)
          }
        }

        // Fetch all NFT transfers for this address from Blockscout (V3 and V2 contracts)
        let ownedTokenIdsV3: Set<string> = new Set()
        let ownedTokenIdsV2: Set<string> = new Set()
        let mintDatesMapV3: { [tokenId: string]: number } = {}
        let mintDatesMapV2: { [tokenId: string]: number } = {}

        // Helper function to fetch NFTs from a specific contract
        const fetchNFTsFromContract = async (contractAddr: string, isV2: boolean = false) => {
          try {
            const apiUrl = `${BLOCKSCOUT_API_URL}?module=account&action=tokennfttx&contractaddress=${contractAddr}&address=${address}&page=1&offset=200&sort=asc`
            const response = await fetch(apiUrl)
            const data = await response.json()

            console.log(`[Collection] Blockscout API response for ${isV2 ? 'V2' : 'V3'}:`, data.status, 'results:', data.result?.length)

            if (data.status === '1' && Array.isArray(data.result)) {
              const userTokens: { [tokenId: string]: boolean } = {}
              const mintDates: { [tokenId: string]: number } = {}

              // Process all transfers in chronological order
              data.result.forEach((tx: any) => {
                const tokenId = tx.tokenID
                const timestamp = parseInt(tx.timeStamp) * 1000
                const from = tx.from.toLowerCase()
                const to = tx.to.toLowerCase()
                const userAddr = address.toLowerCase()

                // Track mint dates (from zero address)
                if (from === '0x0000000000000000000000000000000000000000') {
                  mintDates[tokenId] = timestamp
                }

                // Track ownership changes for this user
                if (to === userAddr) {
                  userTokens[tokenId] = true
                } else if (from === userAddr) {
                  userTokens[tokenId] = false
                }
              })

              // Store results
              const ownedSet = new Set<string>()
              Object.entries(userTokens).forEach(([tokenId, owned]) => {
                if (owned) ownedSet.add(tokenId)
              })

              console.log(`[Collection] User owns ${ownedSet.size} NFTs from ${isV2 ? 'V2' : 'V3'} contract`)

              return { ownedTokenIds: ownedSet, mintDatesMap: mintDates }
            }
            return { ownedTokenIds: new Set<string>(), mintDatesMap: {} }
          } catch (err) {
            console.error(`[Collection] Failed to fetch transfers from ${isV2 ? 'V2' : 'V3'} contract:`, err)
            return { ownedTokenIds: new Set<string>(), mintDatesMap: {} }
          }
        }

        // Fetch from V3 contract
        const v3Result = await fetchNFTsFromContract(CONTRACT_ADDRESS, false)
        ownedTokenIdsV3 = v3Result.ownedTokenIds
        mintDatesMapV3 = v3Result.mintDatesMap

        // Fetch from V2 contract if available
        if (CONTRACT_ADDRESS_V2) {
          const v2Result = await fetchNFTsFromContract(CONTRACT_ADDRESS_V2, true)
          ownedTokenIdsV2 = v2Result.ownedTokenIds
          mintDatesMapV2 = v2Result.mintDatesMap
        }

        // If we didn't get any owned tokens from Blockscout, fall back to checking all tokens
        if (ownedTokenIdsV3.size === 0 && ownedTokenIdsV2.size === 0) {
          console.log('[Collection] No owned tokens from Blockscout, falling back to checking all tokens')

          // Check V3 contract
          try {
            const nextTokenIdV3 = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: zodiacNftAbi,
              functionName: 'nextTokenId',
            }) as bigint

            const totalTokensV3 = Number(nextTokenIdV3)
            console.log('[Collection] V3 total tokens minted:', totalTokensV3)

            for (let tokenId = 0; tokenId < totalTokensV3; tokenId++) {
              try {
                const owner = await publicClient.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: zodiacNftAbi,
                  functionName: 'ownerOf',
                  args: [BigInt(tokenId)],
                }) as `0x${string}`

                if (owner.toLowerCase() === address.toLowerCase()) {
                  ownedTokenIdsV3.add(tokenId.toString())
                }
              } catch (err) {
                // Token might not exist or other error
              }
            }
          } catch (err) {
            console.error('[Collection] Error checking V3 tokens:', err)
          }

          // Check V2 contract if available
          if (CONTRACT_ADDRESS_V2) {
            try {
              const nextTokenIdV2 = await publicClient.readContract({
                address: CONTRACT_ADDRESS_V2,
                abi: zodiacNftAbi,
                functionName: 'nextTokenId',
              }) as bigint

              const totalTokensV2 = Number(nextTokenIdV2)
              console.log('[Collection] V2 total tokens minted:', totalTokensV2)

              for (let tokenId = 0; tokenId < totalTokensV2; tokenId++) {
                try {
                  const owner = await publicClient.readContract({
                    address: CONTRACT_ADDRESS_V2,
                    abi: zodiacNftAbi,
                    functionName: 'ownerOf',
                    args: [BigInt(tokenId)],
                  }) as `0x${string}`

                  if (owner.toLowerCase() === address.toLowerCase()) {
                    ownedTokenIdsV2.add(tokenId.toString())
                  }
                } catch (err) {
                  // Token might not exist or other error
                }
              }
            } catch (err) {
              console.error('[Collection] Error checking V2 tokens:', err)
            }
          }
        }

        // Fetch metadata for owned tokens from both contracts
        const nftPromises: Promise<NFT | null>[] = []

        // Helper function to fetch NFT metadata
        const fetchNFTMetadata = async (tokenId: string, contractAddr: string, mintDatesMap: { [tokenId: string]: number }) => {
          try {
            const tokenURI = await publicClient.readContract({
              address: contractAddr as `0x${string}`,
              abi: zodiacNftAbi,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            }) as string

            // Get mint date from the map we built earlier
            const mintedDate = mintDatesMap[tokenId]

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
              tokenId,
              tokenURI,
              mintedDate,
              contractAddress: contractAddr,
              metadata,
              type: 'minted' as const
            }
          } catch (err) {
            // Token might not exist yet or other error
            return null
          }
        }

        // Fetch metadata from V3 contract
        for (const tokenId of ownedTokenIdsV3) {
          nftPromises.push(fetchNFTMetadata(tokenId, CONTRACT_ADDRESS, mintDatesMapV3))
        }

        // Fetch metadata from V2 contract
        for (const tokenId of ownedTokenIdsV2) {
          nftPromises.push(fetchNFTMetadata(tokenId, CONTRACT_ADDRESS_V2!, mintDatesMapV2))
        }

        const fetchedNFTs = await Promise.all(nftPromises)
        const userNFTs = fetchedNFTs.filter((nft): nft is NFT => nft !== null)

        // Count NFTs by contract
        const v3NFTs = userNFTs.filter(nft => nft.contractAddress.toLowerCase() === CONTRACT_ADDRESS.toLowerCase())
        const v2NFTs = userNFTs.filter(nft => CONTRACT_ADDRESS_V2 && nft.contractAddress.toLowerCase() === CONTRACT_ADDRESS_V2.toLowerCase())

        console.log('[Collection] Fetched minted NFTs:', userNFTs.length, '(V3:', v3NFTs.length, 'V2:', v2NFTs.length, ')')

        // Combine minted NFTs and generated fortunes
        const allItems: CollectionItem[] = [...userNFTs, ...generatedItems]

        // Sort by date - newest first (use mintedDate for NFTs, createdAt for generated)
        allItems.sort((a, b) => {
          const dateA = a.type === 'minted' ? (a.mintedDate || 0) : new Date(a.createdAt).getTime()
          const dateB = b.type === 'minted' ? (b.mintedDate || 0) : new Date(b.createdAt).getTime()
          return dateB - dateA
        })

        console.log('[Collection] Total items:', allItems.length, '(NFTs:', userNFTs.length, 'Generated:', generatedItems.length, ')')

        setItems(allItems)
      } catch (err) {
        console.error('Error fetching NFTs:', err)
        setError('Failed to load your collection. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollection()
  }, [address, isConnected, publicClient])

  const handleViewOnBlockscout = (tokenId: string, contractAddress: string) => {
    const baseUrl = TARGET_CHAIN_ID === 42220
      ? 'https://celo.blockscout.com/token'
      : 'https://alfajores.blockscout.com/token'
    const url = `${baseUrl}/${contractAddress.toLowerCase()}/instance/${tokenId}`
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
          Your Zodiac Cards - minted NFTs and generated fortunes
        </p>

        {isLoading ? (
          <CollectionLoading />
        ) : error ? (
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="p-8 text-center">
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="w-full bg-white/10 backdrop-blur-md border-amber-300/20">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-16 w-16 text-amber-300 mb-4" />
              <h2 className="text-2xl font-bold text-amber-300 mb-2">No Cards Yet</h2>
              <p className="text-violet-200 mb-4">
                You haven't created any Zodiac Cards yet. Start your cosmic journey!
              </p>
              <Link href="/">
                <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Your First Card
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const isMinted = item.type === 'minted'

              return (
              <Card
                key={isMinted ? `nft-${item.tokenId}` : `gen-${item.id}`}
                className="bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-0 relative">
                  {/* Type Badge */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isMinted
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 text-amber-950'
                    }`}>
                      {isMinted ? 'Minted' : 'Generated'}
                    </span>
                    {isMinted && CONTRACT_ADDRESS_V2 && item.contractAddress.toLowerCase() === CONTRACT_ADDRESS_V2.toLowerCase() && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                        V2
                      </span>
                    )}
                  </div>

                  {/* Image Display */}
                  {!isMinted ? (
                    // Generated fortune image
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-amber-100">
                      <Image
                        src={item.imageUrl}
                        alt={`${item.zodiacType} - ${item.zodiacSign}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  ) : item.metadata?.image ? (
                    // Minted NFT image
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-100 to-amber-100">
                      <Image
                        src={
                          item.metadata.image
                            .replace('ipfs://', `${PINATA_GATEWAY}/ipfs/`)
                            .replace('https://ipfs.io/ipfs/', `${PINATA_GATEWAY}/ipfs/`)
                        }
                        alt={item.metadata.name || `NFT #${item.tokenId}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                        onError={(e) => {
                          console.error('[Collection] Image failed to load:', item.metadata?.image)
                          const target = e.target as HTMLImageElement
                          const currentSrc = target.src

                          if (currentSrc.includes('pinata')) {
                            const hash = item.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://cloudflare-ipfs.com/ipfs/${hash}`
                          } else if (currentSrc.includes('cloudflare')) {
                            const hash = item.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://dweb.link/ipfs/${hash}`
                          } else if (currentSrc.includes('dweb')) {
                            const hash = item.metadata?.image?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '') || ''
                            target.src = `https://ipfs.io/ipfs/${hash}`
                          }
                        }}
                      />
                    </div>
                  ) : (
                    // Fallback placeholder
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-200 to-amber-200 flex items-center justify-center">
                      <Sparkles className="h-16 w-16 text-amber-600 opacity-50" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-gray-800 mb-1">
                      {!isMinted
                        ? `Zodiac Card Fortune #${item.metadataURI ? item.metadataURI.replace('ipfs://', '').slice(0, 9).toUpperCase() : item.id}`
                        : (item.metadata?.name || `Zodiac Card #${item.tokenId}`)}
                    </h3>

                    {!isMinted ? (
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {item.fortuneText}
                      </p>
                    ) : item.metadata?.description && (
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {item.metadata.description}
                      </p>
                    )}

                    {!isMinted ? (
                      <p className="text-xs text-gray-500">
                        Created: {new Date(item.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    ) : item.mintedDate && (
                      <p className="text-xs text-gray-500">
                        Minted: {new Date(item.mintedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}

                    {!isMinted ? (
                      <div className="space-y-1 pt-2 border-t border-amber-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Zodiac Card:</span> {item.zodiacType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Zodiac Sign:</span> {item.zodiacSign}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Username:</span> {item.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Collection:</span> Zodiac Card
                        </p>
                      </div>
                    ) : item.metadata?.attributes && (
                      <div className="space-y-1 pt-2 border-t border-amber-200">
                        {item.metadata.attributes.map((attr, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            <span className="font-medium">{attr.trait_type}:</span> {attr.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  {isMinted ? (
                    <>
                      <NFTShareButton
                        tokenId={item.tokenId}
                        name={item.metadata?.name || `Zodiac Card #${item.tokenId}`}
                        description={item.metadata?.description}
                        imageUrl={(() => {
                          const ipfsHash = item.metadata.image
                            .replace('ipfs://', '')
                            .replace('https://gateway.pinata.cloud/ipfs/', '')
                            .replace('https://ipfs.io/ipfs/', '')
                          return `https://zodiaccard.xyz/api/nft-image/${ipfsHash}`
                        })()}
                        attributes={item.metadata?.attributes}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleViewOnBlockscout(item.tokenId, item.contractAddress)}
                        variant="outline"
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Blockscout
                      </Button>
                    </>
                  ) : (
                    <>
                      <ShareButton
                        username={item.username || 'User'}
                        sign={item.zodiacSign}
                        fortune={item.fortuneText}
                        imageUrl={item.imageUrl}
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      />
                      <Link
                        href={`/mint/${item.id}?username=${encodeURIComponent(item.username || '')}&sign=${encodeURIComponent(item.zodiacSign)}&zodiacType=${encodeURIComponent(item.zodiacType)}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                          Mint as NFT
                        </Button>
                      </Link>
                    </>
                  )}
                </CardFooter>
              </Card>
            )})}
          </div>
        )}
      </div>
    </main>
  )
}
