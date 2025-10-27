/**
 * Divvi Referral SDK Integration
 * Handles referral tracking for on-chain NFT minting transactions
 */

import { getReferralTag, submitReferral } from '@divvi/referral-sdk'

// Divvi Consumer Address (Zodiac Cards Divvi Identifier)
// This is your unique identifier on Divvi for tracking referrals
export const DIVVI_CONSUMER_ADDRESS = (
  process.env.NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS ||
  '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'
) as `0x${string}`

/**
 * Generate referral tag for transaction data suffix
 * @param userAddress - Address of the user performing the transaction
 * @returns Hex string referral tag to append to transaction data (without 0x prefix)
 */
export function generateReferralTag(userAddress: `0x${string}`): string {
  try {
    // Generate referral tag with user address and consumer identifier
    const tag = getReferralTag({
      user: userAddress,
      consumer: DIVVI_CONSUMER_ADDRESS,
    })
    // Return tag without 0x prefix (will be appended to contract data)
    return tag
  } catch (error) {
    console.error('Error generating Divvi referral tag:', error)
    // Return empty string if referral tag generation fails
    return ''
  }
}

/**
 * Submit referral to Divvi API after successful transaction
 * This reports the transaction to Divvi which will decode the referral metadata
 * and record the referral on-chain via the DivviRegistry contract
 *
 * @param txHash - Transaction hash of the completed transaction
 * @param chainId - Chain ID where transaction occurred
 */
export async function submitDivviReferral(
  txHash: `0x${string}`,
  chainId: number
): Promise<void> {
  try {
    await submitReferral({
      txHash,
      chainId,
    })
    console.log('✅ Successfully submitted referral to Divvi:', {
      txHash,
      chainId,
      consumer: DIVVI_CONSUMER_ADDRESS
    })
  } catch (error) {
    // Log error but don't throw - referral tracking should not break main flow
    console.error('⚠️ Error submitting Divvi referral:', error)
  }
}

/**
 * Helper to check if Divvi integration is enabled
 */
export function isDivviEnabled(): boolean {
  return !!DIVVI_CONSUMER_ADDRESS && DIVVI_CONSUMER_ADDRESS !== '0x'
}
