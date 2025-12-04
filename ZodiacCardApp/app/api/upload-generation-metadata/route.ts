import { NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'

export const maxDuration = 60

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY || '',
  process.env.PINATA_SECRET_KEY || ''
)

interface UploadMetadataRequest {
  fortuneText: string
  imageUrl: string
  zodiacType: string
  zodiacSign: string
  paymentTxHash: string
  paymentAmount: string
  username?: string
  description?: string
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
    } = body

    // Validate required fields
    if (!fortuneText || !imageUrl || !zodiacType || !zodiacSign || !paymentTxHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create metadata JSON object
    const metadata = {
      fortuneText,
      imageUrl,
      zodiacType,
      zodiacSign,
      paymentTxHash,
      paymentAmount,
      username: username || '',
      description: description || '',
      generatedAt: new Date().toISOString(),
    }

    console.log('[Upload Metadata] Uploading to IPFS:', {
      zodiacType,
      zodiacSign,
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
