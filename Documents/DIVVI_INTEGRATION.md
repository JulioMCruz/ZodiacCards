# 🎯 Divvi Referral Integration

This document describes the Divvi referral tracking integration in the Zodiac Cards NFT project.

## Overview

Divvi is integrated to track and reward referrals for NFT minting activities on the Celo blockchain. Every time a user mints a Zodiac Card NFT, the transaction is tagged with referral metadata and reported to Divvi for attribution tracking.

## How It Works

### 1. **Referral Tag Generation**
When a user initiates an NFT mint:
- A unique referral tag is generated using the user's wallet address
- The tag includes the user address and your Divvi Consumer Address
- The tag is appended to the transaction data as a suffix

### 2. **On-Chain Transaction**
The mint transaction includes:
- Standard NFT mint function call (`mint(address, tokenURI)`)
- Payment in native CELO tokens
- Referral tag appended to transaction data (invisible to users)

### 3. **Referral Submission**
After the transaction confirms:
- The transaction hash and chain ID are submitted to Divvi's API
- Divvi decodes the referral metadata from the transaction
- The referral is recorded on-chain via the DivviRegistry contract

## Architecture

```
User Initiates Mint
        ↓
Generate Referral Tag (user + consumer address)
        ↓
Mint NFT Transaction (with dataSuffix)
        ↓
Transaction Confirmed
        ↓
Submit to Divvi API
        ↓
Divvi Records On-Chain Attribution
```

## Implementation Details

### Files Modified

#### 1. **lib/divvi.ts** - Divvi SDK Integration
```typescript
// Generate referral tag
generateReferralTag(userAddress: `0x${string}`): string

// Submit referral after transaction
submitDivviReferral(txHash: `0x${string}`, chainId: number): Promise<void>

// Check if Divvi is enabled
isDivviEnabled(): boolean
```

#### 2. **hooks/useContractInteraction.ts** - Added dataSuffix Support
```typescript
writeContract({
  address,
  abi,
  functionName,
  args,
  value,
  dataSuffix // Support for Divvi referral tags
})
```

#### 3. **components/mint-button.tsx** - Mint Flow Integration
```typescript
// Generate referral tag
const referralTag = generateReferralTag(address)

// Include in transaction
const mintHash = await writeContract({
  dataSuffix: `0x${referralTag}`
})

// Submit to Divvi after confirmation
await submitDivviReferral(mintHash, chainId)
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# Divvi Consumer Address (your unique Divvi identifier)
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
```

### Consumer Address

Your Divvi Consumer Address is: **`0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`**

This address:
- Identifies your project on the Divvi platform
- Is used to track all referrals for Zodiac Cards
- Is publicly visible in transaction data
- Cannot be changed without updating the integration

## Verification

### Check Referral Registration

After a mint transaction, you can verify the referral was registered:

1. **Check DivviRegistry Contract**
   - Look for `ReferralRegistered` events
   - Filter by your consumer address
   - Verify transaction hash matches

2. **Check Console Logs**
   ```
   🎯 Minting with Divvi tracking: { enabled: true, user: 0x..., hasTag: true }
   ✅ Successfully submitted referral to Divvi: { txHash: 0x..., chainId: 42220 }
   ```

3. **Inspect Transaction Data**
   - View transaction on Celoscan
   - Check "Input Data" field
   - Referral metadata is appended at the end

### Verification Tool

Use Divvi's verification tool:
```
https://app.divvi.xyz/verify?tx=<TRANSACTION_HASH>&chain=42220
```

## Benefits

### For Your Project
- ✅ Track user acquisition and growth
- ✅ Earn rewards for driving on-chain activity
- ✅ Zero code changes when joining new campaigns
- ✅ Permissionless reward distribution

### For Users
- ✅ Completely transparent (on-chain)
- ✅ No additional gas costs
- ✅ No change to user experience
- ✅ Privacy-preserving (only wallet addresses)

## Error Handling

The integration is designed to be non-blocking:

- If referral tag generation fails → transaction continues without tag
- If Divvi submission fails → transaction still succeeds, error logged
- All errors are logged to console but don't affect the mint flow

```typescript
// Example error handling
try {
  const referralTag = generateReferralTag(address)
} catch (error) {
  console.error('Error generating Divvi referral tag:', error)
  return '' // Continue without tag
}
```

## Testing

### On Testnet (Celo Alfajores)

1. Deploy contract to Alfajores testnet
2. Update `NEXT_PUBLIC_CHAIN_ID=44787`
3. Mint test NFT and verify referral tracking

### On Mainnet (Celo)

1. Ensure `NEXT_PUBLIC_CHAIN_ID=42220`
2. Verify consumer address is correct
3. Monitor console for successful submissions
4. Check DivviRegistry for `ReferralRegistered` events

## Monitoring

### Console Logs

- `🎯 Minting with Divvi tracking` - Referral tag generated
- `✅ Successfully submitted referral to Divvi` - Submission confirmed
- `⚠️ Error submitting Divvi referral` - Submission failed (non-blocking)

### Analytics

Track Divvi performance:
- Number of mints with referral tags
- Successful Divvi submissions vs total mints
- Any errors in tag generation or submission

## Maintenance

### Updating Consumer Address

To change your Divvi Consumer Address:

1. Update in `lib/divvi.ts`:
   ```typescript
   export const DIVVI_CONSUMER_ADDRESS = 'YOUR_NEW_ADDRESS'
   ```

2. Update in `.env.example` and `.env.local`

3. Redeploy frontend

### SDK Updates

Keep the Divvi SDK updated:
```bash
pnpm update @divvi/referral-sdk
```

Check for breaking changes in [Divvi SDK releases](https://github.com/divvi-xyz/divvi-referral-sdk).

## Support

- **Divvi Documentation**: https://docs.divvi.xyz
- **Divvi Discord**: https://discord.gg/divvi
- **Builder Onboarding**: https://app.divvi.xyz/builders/onboarding

## Security Considerations

### Data Privacy
- ✅ Only wallet addresses are shared (already public)
- ✅ No personal information is transmitted
- ✅ No additional permissions required

### Transaction Safety
- ✅ Referral tag doesn't affect contract execution
- ✅ Tag is appended after function calldata
- ✅ Failed tag generation doesn't block minting

### Smart Contract Security
- ✅ No changes required to smart contract
- ✅ Works with existing contract implementation
- ✅ dataSuffix is safely ignored by contract

## Transaction Example

### Without Divvi
```
Function: mint(address recipient, string tokenURI)
Data: 0x40c10f190000...
```

### With Divvi
```
Function: mint(address recipient, string tokenURI)
Data: 0x40c10f190000...[DIVVI_REFERRAL_TAG]
```

The referral tag is cryptographically generated metadata that includes:
- User wallet address
- Consumer identifier
- Timestamp and other attribution data

## Next Steps

1. **Monitor Performance**
   - Track referral submissions in production
   - Monitor console for errors
   - Check Divvi dashboard for attribution

2. **Optimize**
   - Add custom referral parameters if needed
   - Track conversion metrics
   - A/B test referral strategies

3. **Scale**
   - Join Divvi campaigns for rewards
   - Integrate Divvi into other contract interactions
   - Build referral program on top of Divvi

## Resources

- [Divvi SDK Documentation](https://github.com/divvi-xyz/divvi-referral-sdk)
- [Divvi Builder Portal](https://app.divvi.xyz/builders)
- [DivviRegistry Contract](https://docs.divvi.xyz/contracts/registry)
- [Zodiac Cards Contract](https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158)

---

**Integration Status**: ✅ **Complete and Production-Ready**

**Last Updated**: 2025-10-26
**Divvi SDK Version**: 2.3.0
**Network**: Celo Mainnet (Chain ID: 42220)
