import { NextRequest, NextResponse } from 'next/server'

// Pinata gateway configuration
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const { hash } = params

  if (!hash) {
    return NextResponse.json({ error: 'Missing IPFS hash' }, { status: 400 })
  }

  try {
    // Fetch the image from Pinata gateway
    const imageUrl = `${PINATA_GATEWAY}/ipfs/${hash}`

    console.log('[NFT Image Proxy] Fetching image from:', imageUrl)

    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    })

    if (!response.ok) {
      console.error('[NFT Image Proxy] Failed to fetch image:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    console.log('[NFT Image Proxy] Successfully fetched image, size:', imageBuffer.byteLength, 'bytes')

    // Return the image with proper headers for caching
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[NFT Image Proxy] Error proxying image:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
