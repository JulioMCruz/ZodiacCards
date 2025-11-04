import { NextRequest, NextResponse } from 'next/server'

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
]

export async function POST(req: NextRequest) {
  try {
    const { tokenURI } = await req.json()

    if (!tokenURI) {
      console.error('❌ [NFT Metadata API] Missing tokenURI in request')
      return NextResponse.json(
        { error: 'tokenURI is required' },
        { status: 400 }
      )
    }

    console.log('📥 [NFT Metadata API] Fetching metadata for tokenURI:', tokenURI)

    const ipfsHash = tokenURI.replace('ipfs://', '')
    console.log('🔗 [NFT Metadata API] IPFS hash:', ipfsHash)

    let metadata = null
    let successfulGateway = null
    const errors: string[] = []

    for (const gateway of IPFS_GATEWAYS) {
      try {
        const metadataUrl = `${gateway}${ipfsHash}`
        console.log(`🔄 [NFT Metadata API] Trying gateway: ${metadataUrl}`)

        const controller = new AbortController()
        const timeout = setTimeout(() => {
          controller.abort()
          console.warn(`⏱️ [NFT Metadata API] Timeout for gateway: ${gateway}`)
        }, 10000)

        const startTime = Date.now()
        const response = await fetch(metadataUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
          cache: 'force-cache'
        })
        clearTimeout(timeout)

        const elapsed = Date.now() - startTime
        console.log(`⏱️ [NFT Metadata API] Gateway ${gateway} responded in ${elapsed}ms with status: ${response.status}`)

        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`
          errors.push(`${gateway} - ${errorMsg}`)
          console.warn(`⚠️ [NFT Metadata API] Gateway ${gateway} failed:`, errorMsg)
          continue
        }

        const contentType = response.headers.get('content-type')
        console.log(`📄 [NFT Metadata API] Content-Type from ${gateway}:`, contentType)

        metadata = await response.json()
        successfulGateway = gateway
        console.log(`✅ [NFT Metadata API] Successfully fetched metadata from ${gateway}`)
        console.log(`📊 [NFT Metadata API] Metadata keys:`, Object.keys(metadata || {}))
        break
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${gateway} - ${errorMessage}`)
        console.error(`❌ [NFT Metadata API] Error with gateway ${gateway}:`, {
          error: errorMessage,
          name: err instanceof Error ? err.name : 'Unknown',
          stack: err instanceof Error ? err.stack : undefined
        })
      }
    }

    if (!metadata) {
      console.error('❌ [NFT Metadata API] All gateways failed for tokenURI:', tokenURI)
      console.error('❌ [NFT Metadata API] Error summary:', errors)
      return NextResponse.json(
        {
          error: 'Failed to fetch metadata from all IPFS gateways',
          tokenURI,
          attemptedGateways: IPFS_GATEWAYS,
          errors
        },
        { status: 503 }
      )
    }

    console.log('✅ [NFT Metadata API] Success! Gateway:', successfulGateway)
    console.log('📦 [NFT Metadata API] Metadata:', JSON.stringify(metadata, null, 2))

    return NextResponse.json({
      success: true,
      metadata,
      gateway: successfulGateway
    })

  } catch (error) {
    console.error('❌ [NFT Metadata API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
