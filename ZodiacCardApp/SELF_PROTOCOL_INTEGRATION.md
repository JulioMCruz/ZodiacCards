# Self Protocol Integration - Zodiac Card App

## Overview
Integration of Self Protocol to auto-fill birth date information for users in the Farcaster environment. Users can verify their identity using their Self mobile app and have their date of birth automatically populated in the form.

## Features
- ✅ **Privacy-preserving identity verification** - Users verify with Self Protocol mobile app
- ✅ **Auto-fill birth year** - Date of birth from verification auto-populates the form
- ✅ **Farcaster-specific** - Button only appears when user is in Farcaster environment
- ✅ **Wallet-based authentication** - Tied to connected wallet address
- ✅ **Minimum age verification** - Ensures users are 13+ years old

## Components Added

### 1. Backend Verification Endpoint
**File**: `app/api/verify-self/route.ts`

Handles Self Protocol attestation verification:
- Verifies zero-knowledge proofs from Self Protocol
- Validates minimum age requirements (13+)
- Extracts date of birth disclosure
- Stores verification result in memory cache
- Returns verification data to frontend

**Configuration**:
```typescript
{
  scope: "zodiac-card-app",
  minimumAge: 13,
  excludedCountries: [],
  ofac: false,
  disclosures: {
    date_of_birth: true
  }
}
```

### 2. Verification Check Endpoint
**File**: `app/api/verify-self/check/route.ts`

Polling endpoint for checking verification status:
- Stores verification results in global cache
- Auto-expires entries after 1 hour
- Returns verification status and date of birth

### 3. Self Verify Button Component
**File**: `components/self-verify-button.tsx`

React component that handles Self Protocol integration:
- Initializes Self app with user's wallet address
- Generates universal link for Self mobile app
- Opens Self app in Farcaster environment using SDK
- Polls for verification completion
- Triggers callback with date of birth on success

**Props**:
```typescript
{
  onVerificationSuccess: (dateOfBirth: string) => void
  disabled?: boolean
}
```

### 4. Updated Zodiac Form
**File**: `components/zodiac-form.tsx`

Integrated Self verification button:
- Only shows in Farcaster environment (`isAuthenticated`)
- Positioned below birth year input field
- Auto-fills birth year when verification completes
- Extracts year from date format "YYYY-MM-DD"

## Environment Configuration

Added to `.env`:
```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="Zodiac Card"
NEXT_PUBLIC_SELF_SCOPE="zodiac-card-app"
NEXT_PUBLIC_SELF_USE_MOCK="false" # Set to "true" for testnet
NEXT_PUBLIC_SELF_LOGO_URL="https://codalabs-public-assets.s3.us-east-1.amazonaws.com/ZodiacImages/ZodiacCard04.png"
```

## User Flow

1. User opens Zodiac Card app in Farcaster
2. User connects wallet
3. User sees "Get Info from Self Protocol" button below birth year field
4. User clicks button
5. Self mobile app opens (via Farcaster SDK)
6. User completes identity verification in Self app
7. Verification sent to backend endpoint
8. Backend validates attestation and extracts date of birth
9. Frontend polls check endpoint
10. Birth year auto-fills in form when verification completes

## Technical Details

### Self Protocol SDK Configuration
```typescript
const app = new SelfAppBuilder({
  version: 2,
  appName: "Zodiac Card",
  scope: "zodiac-card-app",
  endpoint: "https://codalabs.ngrok.io/api/verify-self",
  userId: userWalletAddress,
  endpointType: "https",
  userIdType: "hex",
  disclosures: {
    minimumAge: 13,
    date_of_birth: true
  }
}).build()
```

### Verification Process
1. User initiates verification
2. Self mobile app generates zero-knowledge proof
3. Proof sent to backend endpoint
4. `SelfBackendVerifier` validates:
   - Attestation authenticity
   - Minimum age requirement (13+)
   - Proof integrity
5. Date of birth extracted from disclosure
6. Result cached with user's wallet address
7. Frontend polls until verification found

### Polling Implementation
- Poll interval: 2 seconds
- Max poll duration: 5 minutes (300 seconds)
- Cache expiration: 1 hour
- Storage: In-memory global Map (consider Redis for production)

## Dependencies

```json
{
  "@selfxyz/core": "^0.0.9",
  "@selfxyz/qrcode": "^1.0.15"
}
```

## Security Considerations

1. **Zero-Knowledge Proofs** - User identity verified without revealing sensitive data
2. **Minimum Age Validation** - Backend enforces 13+ age requirement
3. **Wallet-Based Auth** - Verification tied to wallet address
4. **Cache Expiration** - Auto-cleanup of old verification data
5. **HTTPS Required** - All verification traffic encrypted

## Production Recommendations

1. **Replace in-memory cache with Redis**:
   ```typescript
   // Instead of global.verificationCache
   import Redis from 'ioredis'
   const redis = new Redis(process.env.REDIS_URL)
   await redis.setex(`verification:${userId}`, 3600, JSON.stringify(data))
   ```

2. **Use websockets instead of polling**:
   - More efficient than polling every 2 seconds
   - Instant notification when verification completes

3. **Add rate limiting**:
   - Prevent verification spam
   - Limit requests per IP/wallet

4. **Enhanced error handling**:
   - User-friendly error messages
   - Retry mechanisms for failed verifications

5. **Analytics tracking**:
   - Track verification success rates
   - Monitor user drop-off points

## Testing

### Testnet Testing (Celo Sepolia)
1. Set `NEXT_PUBLIC_SELF_USE_MOCK="true"` in `.env`
2. Use Celo Sepolia testnet
3. Self mobile app supports mock passports
4. Test verification flow end-to-end

### Mainnet Testing (Celo Mainnet)
1. Set `NEXT_PUBLIC_SELF_USE_MOCK="false"` in `.env`
2. Use real Self Protocol verification
3. Requires actual passport verification
4. Test with real user wallets

## Troubleshooting

### Button not appearing
- Check if user is authenticated in Farcaster
- Verify `isAuthenticated` from FarcasterContext
- Ensure wallet is connected

### Verification not completing
- Check browser console for errors
- Verify backend endpoint is accessible
- Check Self mobile app logs
- Ensure ngrok tunnel is active

### Date not auto-filling
- Check polling is active (browser network tab)
- Verify verification stored in cache
- Check `date_of_birth` format returned
- Ensure year extraction works correctly

## Documentation References

- [Self Protocol Disclosures](https://docs.self.xyz/use-self/disclosures)
- [QR Code SDK](https://docs.self.xyz/frontend-integration/qrcode-sdk)
- [Backend Integration](https://docs.self.xyz/backend-integration/basic-integration)
- [Config Store](https://docs.self.xyz/backend-integration/configstore)
- [Backend Verifier API](https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference)
