import { NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'

/**
 * Upload Generation Metadata API
 *
 * Uploads fortune generation metadata to IPFS via Pinata for NFT records.
 * Includes seasonal theme information for historical tracking of themed NFTs.
 *
 * Seasonal Theme Storage:
 * - theme: Theme ID string ('regular', 'winter-holidays', 'new-year')
 * - themeInfo: Full theme details object for display purposes
 *   - Winter Holidays: Festive December theme with snow & lights
 *   - New Year: Celebration theme with fireworks & sparkles
 *
 * The stored theme data enables:
 * - NFT collection filtering by theme
 * - Historical record of limited-time seasonal NFTs
 * - Display of theme badge on collection items
 */

export const maxDuration = 60

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY || '',
  process.env.PINATA_SECRET_KEY || ''
)

/**
 * Request body for metadata upload
 * Includes optional seasonal theme fields for Winter Holidays/New Year NFTs
 */
interface UploadMetadataRequest {
  fortuneText: string
  imageUrl: string
  zodiacType: string
  zodiacSign: string
  paymentTxHash: string
  paymentAmount: string
  username?: string
  description?: string
  // Seasonal theme ID: 'regular' | 'winter-holidays' | 'new-year'
  theme?: string
  // Full theme details for metadata display
  themeInfo?: {
    id: string
    name: string
    description: string
    emoji: string
  }
}

export async function POST(req: Request) {
  try {
    const body: UploadMetadataRequest = await req.json()
    const {
      fortuneText,
      imageUrl,
      zodiacType,
      zodiacSign,
      paymentTxHash,
      paymentAmount,
      username,
      description,
      theme,
      themeInfo,
    } = body

    // Validate required fields
    if (!fortuneText || !imageUrl || !zodiacType || !zodiacSign || !paymentTxHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create metadata JSON object for IPFS storage
    // Includes seasonal theme info for NFT historical record and collection display
    const metadata = {
      fortuneText,
      imageUrl,
      zodiacType,
      zodiacSign,
      paymentTxHash,
      paymentAmount,
      username: username || '',
      description: description || '',
      // Seasonal theme fields - defaults to 'regular' (Classic Zodiac) if not specified
      // Winter Holidays ('winter-holidays') available in December
      // New Year ('new-year') available December 25 - January 7
      theme: theme || 'regular',
      themeInfo: themeInfo || { id: 'regular', name: 'Classic Zodiac', description: 'Traditional cosmic and anime style', emoji: '⭐' },
      generatedAt: new Date().toISOString(),
    }

    console.log('[Upload Metadata] Uploading to IPFS:', {
      zodiacType,
      zodiacSign,
      theme: theme || 'regular',
      fortuneLength: fortuneText.length,
      imageUrl: imageUrl.substring(0, 50) + '...',
    })

    // Upload JSON to Pinata
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `${zodiacType}_${zodiacSign}_fortune_${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    })

    const ipfsUri = `ipfs://${result.IpfsHash}`
    const httpUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`

    console.log('[Upload Metadata] Success:', {
      ipfsUri,
      ipfsHash: result.IpfsHash,
    })

    return NextResponse.json({
      success: true,
      ipfsUri,
      ipfsHash: result.IpfsHash,
      httpUrl,
    })

  } catch (error: any) {
    console.error('[Upload Metadata] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to upload metadata to IPFS',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
