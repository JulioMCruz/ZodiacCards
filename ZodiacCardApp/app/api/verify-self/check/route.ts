import { NextRequest, NextResponse } from 'next/server'

// Declare global type for verification cache
declare global {
  var verificationCache: Map<string, { verified: boolean; date_of_birth?: string; timestamp: number }> | undefined
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Initialize cache if it doesn't exist
    global.verificationCache = global.verificationCache || new Map()

    const normalizedUserId = userId.toLowerCase()
    console.log('🔍 Checking verification for user:', normalizedUserId)
    console.log('🗂️ Cache keys:', Array.from(global.verificationCache.keys()))

    // Check if verification exists for this user
    const verification = global.verificationCache.get(normalizedUserId)

    if (verification) {
      console.log('✅ Found verification:', verification)

      // Clean up old entries (older than 1 hour)
      const now = Date.now()
      const oneHourAgo = now - 3600000

      if (verification.timestamp < oneHourAgo) {
        global.verificationCache.delete(normalizedUserId)
        console.log('❌ Verification expired for user:', normalizedUserId)
        return NextResponse.json({
          verified: false
        })
      }

      console.log('✅ Returning verification data:', verification.date_of_birth)
      return NextResponse.json({
        verified: verification.verified,
        date_of_birth: verification.date_of_birth
      })
    }

    // No verification found yet
    console.log('❌ No verification found for user:', normalizedUserId)
    return NextResponse.json({
      verified: false
    })

  } catch (error) {
    console.error('Check verification error:', error)

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
