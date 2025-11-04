import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zodiac Card NFT'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { tokenId: string } }) {
  const { tokenId } = params

  // Fetch NFT metadata
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS
  const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

  try {
    // In a real implementation, you'd fetch the tokenURI from the contract
    // For now, we'll return a placeholder
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(to bottom, #2D1B69, #1E1240)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F5E6C8',
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 20 }}>✨</div>
          <div>Zodiac Card NFT</div>
          <div style={{ fontSize: 40, marginTop: 20 }}>#{tokenId}</div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(to bottom, #2D1B69, #1E1240)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F5E6C8',
          }}
        >
          Zodiac Cards
        </div>
      ),
      {
        ...size,
      }
    )
  }
}
