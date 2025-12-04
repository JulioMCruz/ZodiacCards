# Zodiac Card Payment System V2 - Implementation Summary

## Overview

Complete redesign of the payment flow with backward compatibility for existing NFTs.

## Payment Structure

| Action | Contract | Collection Tag |
|--------|----------|----------------|
| Image Generation | ZodiacImagePayment | "Generated" |
| NFT from Image | ZodiacNFT V2 | "Minted" (ImageToNFT) |
| Direct NFT Mint | ZodiacNFT V2 | "Minted" (DirectMint) |
| Legacy NFT | ZodiacNFT V1 | "Minted" (LegacyMint) |

## Architecture

### Smart Contracts

#### 1. ZodiacImagePayment.sol
**Location**: `contracts/ZodiacImagePayment.sol`

**Features**:
- Fixed fee for image generation
- Payment tracking with unique paymentId
- User statistics (payment count, total spent)
- S3 key storage for generated images
- Treasury forwarding
- UUPS upgradeable pattern

**Key Functions**:
```solidity
function payForImage() external payable returns (uint256 paymentId)
function markImageGenerated(uint256 paymentId, string memory imageS3Key) external onlyOwner
function getUserPayments(address user) external view returns (uint256[] memory)
function getPayment(uint256 paymentId) external view returns (Payment memory)
function getUserStats(address user) external view returns (uint256 paymentCount, uint256 totalPaid)
```

**Events**:
```solidity
event ImagePaymentReceived(address indexed user, uint256 indexed paymentId, uint256 amount, uint256 timestamp)
event ImageGenerated(uint256 indexed paymentId, address indexed user, string imageS3Key)
```

#### 2. ZodiacNFT V2 (Upgraded)
**Location**: `contracts/ZodiacNFT_V2.sol`

**Changes from V1**:
- Reduced mint fee structure
- Added `MintSource` enum (LegacyMint, DirectMint, ImageToNFT)
- Added `mintFromImagePayment()` function
- Added source tracking mappings
- Added `getTokensBySource()` view function
- Backward compatible with existing NFTs

**New Functions**:
```solidity
function mintFromImagePayment(address to, string memory metadataURI, uint256 imagePaymentId) public payable returns (uint256)
function getTokenDetails(uint256 tokenId) external view returns (address owner, string memory uri, MintSource source, uint256 imagePaymentId)
function getTokensBySource(address owner, MintSource source) external view returns (uint256[] memory)
```

**Backward Compatibility**:
- Existing `mint()` function still works
- Legacy NFTs automatically tagged appropriately
- All existing NFTs remain valid and accessible

### Database Schema

**Location**: `lib/db/schema.sql`

**Tables**:
1. **user_collections**: Main collection table
   - Stores both Generated (image only) and Minted (NFT) items
   - Tracks payment details, zodiac data, and NFT metadata
   - Automatic timestamp management

2. **payment_verifications**: Transaction verification tracking
   - Stores verified payments with access tokens
   - JWT token management for image access
   - Payment status tracking

3. **user_statistics**: Aggregated user metrics
   - Image generation stats
   - NFT minting stats
   - Legacy mint tracking
   - Engagement metrics

**Key Views**:
```sql
user_collection_view -- Complete collection with calculated metadata
```

**Functions**:
```sql
add_generated_image() -- Insert image generation record
convert_to_minted_nft() -- Convert Generated → Minted
```

### Backend API

#### Payment Verification Endpoint
**Location**: `app/api/payment/verify/route.ts`

**POST /api/payment/verify**
- Verifies on-chain payment transaction
- Validates transaction receipt
- Decodes payment events
- Generates JWT access token
- Returns payment details

**Request**:
```json
{
  "txHash": "0x...",
  "userAddress": "0x..."
}
```

**Response**:
```json
{
  "verified": true,
  "paymentDetails": {
    "paymentId": 123,
    "user": "0x...",
    "amount": "2000000000000000000",
    "timestamp": 1234567890,
    "verified": true
  },
  "accessToken": "eyJhbGc...",
  "blockNumber": "12345678",
  "imageGenerated": false
}
```

**GET /api/payment/verify?paymentId=123**
- Fetches payment details from blockchain
- Returns current payment status

## User Flow

### Flow 1: Generate Image + Share

```
1. User fills zodiac form
2. User pays → ZodiacImagePayment.payForImage()
3. Frontend verifies payment → /api/payment/verify
4. Backend generates fortune + image with Replicate Flux Pro
5. Image saved to S3, record added to database ("Generated")
6. User can share to Farcaster immediately
7. Image appears in collection as "Generated"
```

### Flow 2: Generate Image + Mint NFT

```
1-7. Same as Flow 1 (image generation)
8. User chooses "Mint as NFT"
9. User pays → ZodiacNFT.mintFromImagePayment()
10. NFT minted with link to original image payment
11. Collection updated: "Generated" → "Minted" (ImageToNFT)
```

### Flow 3: Direct NFT Mint

```
1. User fills zodiac form
2. User chooses "Skip to NFT"
3. User pays → ZodiacNFT.mint()
4. Fortune + image generated
5. NFT minted immediately
6. Collection shows "Minted" (DirectMint)
```

### Flow 4: Legacy Path - Backward Compatible

```
1. Existing user with legacy pricing
2. Standard mint flow
3. NFT automatically tagged as "LegacyMint"
4. Full backward compatibility maintained
```

## Frontend Updates Required

### 1. Update Constants
**File**: `lib/constants.ts`

```typescript
export const IMAGE_PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`
export const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`
```

### 2. Create Payment Button Component
**File**: `components/image-payment-button.tsx`

```typescript
// Button to pay for image generation
// Handles payment, verification, and access token
```

### 3. Update Result Page
**File**: `app/result/page.tsx`

**Changes**:
- Add payment step before image generation
- Show "Share" and "Mint NFT" options after generation
- Track collection type (Generated vs Minted)

### 4. Update Collection Page
**File**: `app/collection/page.tsx`

**New Features**:
- Filter by collection type (Generated / Minted)
- Display tags (LegacyMint / DirectMint / ImageToNFT)
- Convert Generated → Minted button

### 5. Update NFT Share Button
**File**: `components/nft-share-button.tsx`

**Changes**:
- Works without NFT requirement
- Shares image from S3 for Generated items
- Shares NFT metadata for Minted items

## Environment Variables

### Required New Variables

```bash
# Smart Contracts
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x..." # Updated proxy address

# Fees (see ../docs/CostAnalysis.md)
NEXT_PUBLIC_IMAGE_FEE="2.0"
NEXT_PUBLIC_NFT_MINT_FEE="3.0"

# Database
DATABASE_URL="postgresql://user:pass@host:5432/zodiac_cards"

# JWT for access tokens
JWT_SECRET="your-secure-random-secret-key"

# Existing
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo.org"
NEXT_PUBLIC_TREASURY_ADDRESS="0x..."
REPLICATE_API_TOKEN="r8_..."
```

## Migration Strategy

### Phase 1: Deploy New Contracts
1. Deploy ZodiacImagePayment to Celo mainnet
2. Upgrade ZodiacNFT proxy to V2 implementation
3. Update mint fee configuration

### Phase 2: Database Setup
1. Apply schema.sql to production database
2. Migrate existing NFT data with LegacyMint tags
3. Create indexes for performance

### Phase 3: Frontend Deployment
1. Deploy updated frontend with new contracts
2. Test payment flows end-to-end
3. Monitor for issues

### Phase 4: Data Migration
```sql
-- Tag existing NFTs as LegacyMint
UPDATE user_collections
SET nft_mint_source = 'LegacyMint'
WHERE collection_type = 'Minted'
  AND nft_mint_timestamp < '2025-01-01'
  AND nft_mint_source IS NULL;
```

## Testing Checklist

### Smart Contract Tests
- [ ] Image payment flow
- [ ] NFT minting from image payment
- [ ] Direct NFT minting
- [ ] Legacy NFT tagging
- [ ] User statistics tracking
- [ ] Payment retrieval
- [ ] Treasury forwarding
- [ ] Access control (onlyOwner)

### Backend API Tests
- [ ] Payment verification success
- [ ] Invalid transaction rejection
- [ ] JWT token generation
- [ ] Payment status queries
- [ ] Error handling

### Database Tests
- [ ] add_generated_image() function
- [ ] convert_to_minted_nft() function
- [ ] Statistics aggregation
- [ ] User collection queries
- [ ] Performance with large datasets

### Frontend Tests
- [ ] Payment button flow
- [ ] Transaction confirmation
- [ ] Image generation after payment
- [ ] Share without NFT
- [ ] Convert Generated → Minted
- [ ] Collection filtering
- [ ] Tag display (Generated/Minted/Source)
- [ ] Backward compatibility with legacy NFTs

## Analytics & Monitoring

### Key Metrics to Track

1. **Revenue**: See `../docs/CostAnalysis.md`

2. **Conversion Rates**:
   - Image generation → NFT minting
   - Direct minting vs image-first flow

3. **User Behavior**:
   - Average images per user
   - Average NFTs per user
   - Share rate (Generated items)

### Dashboard Queries

```sql
-- Revenue breakdown
SELECT
  'Image Payments' as category,
  COUNT(*) as count,
  SUM(image_payment_amount) as total_amount
FROM user_collections
WHERE collection_type IN ('Generated', 'Minted')

UNION ALL

SELECT
  'NFT Mints' as category,
  COUNT(*) as count,
  SUM(nft_mint_amount) as total_amount
FROM user_collections
WHERE collection_type = 'Minted';

-- Conversion rate
SELECT
  COUNT(CASE WHEN collection_type = 'Generated' THEN 1 END) as generated_only,
  COUNT(CASE WHEN collection_type = 'Minted' AND nft_mint_source = 'ImageToNFT' THEN 1 END) as converted_to_nft,
  ROUND(
    COUNT(CASE WHEN collection_type = 'Minted' AND nft_mint_source = 'ImageToNFT' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN collection_type = 'Generated' THEN 1 END), 0) * 100,
    2
  ) as conversion_rate_pct
FROM user_collections;
```

## Security Considerations

1. **Payment Verification**: All payments verified on-chain before image access
2. **Access Tokens**: JWT with 24h expiration for image access
3. **Treasury Protection**: Direct contract-to-treasury transfers
4. **Upgrade Safety**: UUPS pattern with onlyOwner authorization
5. **Backward Compatibility**: No breaking changes for existing users

## Support & Documentation

### User-Facing Documentation
- Update FAQ with new features
- Create guide for image sharing without NFT
- Explain collection types (Generated vs Minted)

### Developer Documentation
- Smart contract interfaces
- API endpoints
- Database schema
- Deployment procedures

## Success Criteria

- [ ] 0 contract vulnerabilities
- [ ] <5s payment verification time
- [ ] 100% backward compatibility with legacy NFTs
- [ ] >30% conversion rate (Generated → Minted)
- [ ] <1% payment verification failures

## Next Steps

1. **Review & Audit**: Code review of all components
2. **Testnet Deployment**: Full deployment to Celo Alfajores
3. **Integration Testing**: End-to-end flow testing
4. **Load Testing**: Stress test payment verification
5. **Mainnet Deployment**: Phased rollout to production
6. **Monitoring Setup**: Analytics dashboard and alerts
7. **User Communication**: Announce new features

## Contact & Support

For questions about this implementation:
- Smart Contracts: [Contact dev team]
- Backend API: [Contact dev team]
- Frontend: [Contact dev team]
- Deployment: See `scripts/deploy-payment-system.md`
- **Cost Analysis**: See `../docs/CostAnalysis.md` for detailed financial projections
