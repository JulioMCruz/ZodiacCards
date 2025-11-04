import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(req: Request) {
  try {
    const { imageUrl, tokenId } = await req.json()

    if (!imageUrl || !tokenId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or tokenId' },
        { status: 400 }
      )
    }

    // Validate environment variables
    const bucketName = process.env.AWS_S3_BUCKET
    if (!bucketName) {
      console.error('[NFT Share Upload] AWS_S3_BUCKET environment variable is not set')
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      )
    }

    const bucketDirectory = process.env.AWS_S3_BUCKET_DIRECTORY || 'ZodiacAssets'

    console.log('[NFT Share Upload] Uploading NFT share image for token:', tokenId)
    console.log('[NFT Share Upload] Source image URL:', imageUrl)

    // Fetch the image from the IPFS gateway
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('[NFT Share Upload] Failed to fetch image:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch image from IPFS' },
        { status: 500 }
      )
    }

    const imageBuffer = await response.arrayBuffer()

    // Generate filename using tokenId for uniqueness
    const filename = `nft-share-${tokenId}.png`
    const key = `${bucketDirectory}/${filename}`

    console.log('[NFT Share Upload] Uploading to S3:', key)

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(imageBuffer),
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    })

    await s3Client.send(uploadCommand)

    // Construct the S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

    console.log('[NFT Share Upload] Successfully uploaded to S3:', s3Url)

    return NextResponse.json({ success: true, s3Url })
  } catch (error) {
    console.error('[NFT Share Upload] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload image to S3',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
