# Zodiac Card Payment System V2 Deployment Guide

## Overview

This guide covers the deployment of the new payment system:
- **Image Generation**: 2 CELO (ZodiacImagePayment contract)
- **NFT Minting**: 3 CELO (ZodiacNFT V2 upgrade)
- **Backward Compatibility**: Existing 10 CELO NFTs remain valid

## Prerequisites

1. **Deployment wallet** with sufficient CELO for gas fees
2. **Treasury address** for receiving payments
3. **Environment variables** configured
4. **Database setup** with schema.sql applied

## Phase 1: Deploy ZodiacImagePayment Contract

### Step 1.1: Compile Contract

```bash
cd /ZodiacCardApp
npx hardhat compile
```

### Step 1.2: Deploy Script

Create `scripts/deploy-image-payment.ts`:

```typescript
import { ethers, upgrades } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying ZodiacImagePayment with account:", deployer.address)

  const treasuryAddress = process.env.TREASURY_ADDRESS
  if (!treasuryAddress) {
    throw new Error("TREASURY_ADDRESS not set in environment")
  }

  // Deploy upgradeable contract
  const ZodiacImagePayment = await ethers.getContractFactory("ZodiacImagePayment")
  const contract = await upgrades.deployProxy(
    ZodiacImagePayment,
    [deployer.address, treasuryAddress],
    { initializer: "initialize", kind: "uups" }
  )

  await contract.waitForDeployment()
  const contractAddress = await contract.getAddress()

  console.log("✅ ZodiacImagePayment deployed to:", contractAddress)
  console.log("Treasury address:", treasuryAddress)
  console.log("Image fee: 2 CELO")

  // Save deployment info
  const fs = require("fs")
  const deploymentInfo = {
    network: "celo-mainnet",
    contractName: "ZodiacImagePayment",
    address: contractAddress,
    deployer: deployer.address,
    treasury: treasuryAddress,
    imageFee: "2.0",
    deployedAt: new Date().toISOString(),
  }

  fs.writeFileSync(
    `deployments/celo/ZodiacImagePayment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

### Step 1.3: Execute Deployment

```bash
npx hardhat run scripts/deploy-image-payment.ts --network celo
```

### Step 1.4: Verify Contract

```bash
npx hardhat verify --network celo <CONTRACT_ADDRESS>
```

## Phase 2: Upgrade ZodiacNFT to V2

### Step 2.1: Prepare Upgrade

```typescript
// scripts/upgrade-zodiac-nft-v2.ts
import { ethers, upgrades } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Upgrading ZodiacNFT with account:", deployer.address)

  const currentProxyAddress = process.env.ZODIAC_NFT_PROXY_ADDRESS
  if (!currentProxyAddress) {
    throw new Error("ZODIAC_NFT_PROXY_ADDRESS not set")
  }

  console.log("Current proxy:", currentProxyAddress)

  // Deploy new implementation
  const ZodiacNFTV2 = await ethers.getContractFactory("ZodiacNFT")
  console.log("Preparing upgrade...")

  const upgraded = await upgrades.upgradeProxy(
    currentProxyAddress,
    ZodiacNFTV2
  )

  await upgraded.waitForDeployment()
  console.log("✅ ZodiacNFT upgraded to V2")

  // Update mint fee to 3 CELO
  const tx = await upgraded.setMintFee(ethers.parseEther("3.0"))
  await tx.wait()
  console.log("✅ Mint fee updated to 3 CELO")

  const newFee = await upgraded.mintFee()
  console.log("Current mint fee:", ethers.formatEther(newFee), "CELO")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

### Step 2.2: Execute Upgrade

```bash
npx hardhat run scripts/upgrade-zodiac-nft-v2.ts --network celo
```

### Step 2.3: Verify Upgrade

```bash
# Check current implementation
npx hardhat run scripts/check-implementation.ts --network celo

# Verify new mint fee
npx hardhat run scripts/check-mint-fee.ts --network celo
```

## Phase 3: Database Setup

### Step 3.1: Apply Schema

```bash
psql -h <DB_HOST> -U <DB_USER> -d zodiac_cards -f lib/db/schema.sql
```

### Step 3.2: Verify Tables

```sql
-- Check tables created
\dt

-- Expected tables:
-- user_collections
-- payment_verifications
-- user_statistics
```

### Step 3.3: Test Database Functions

```sql
-- Test add_generated_image function
SELECT add_generated_image(
  '0x1234567890123456789012345678901234567890',
  'Western',
  'Aries',
  '1990-03-21',
  'Test fortune',
  'images/test.png',
  'https://s3.amazonaws.com/images/test.png',
  1,
  '0xabcdef...',
  2.0
);

-- Check result
SELECT * FROM user_collections;
SELECT * FROM user_statistics;
```

## Phase 4: Frontend Configuration

### Step 4.1: Update .env.local

```bash
# New contract addresses
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS="<ZodiacImagePayment_ADDRESS>"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="<ZodiacNFT_Proxy_ADDRESS>"

# Updated fees
NEXT_PUBLIC_IMAGE_FEE="2.0"
NEXT_PUBLIC_NFT_MINT_FEE="3.0"

# Database connection
DATABASE_URL="postgresql://..."

# JWT secret for access tokens
JWT_SECRET="your-secure-random-secret"

# Existing variables
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo.org"
NEXT_PUBLIC_TREASURY_ADDRESS="<TREASURY_ADDRESS>"
```

### Step 4.2: Update Constants

```typescript
// lib/constants.ts
export const IMAGE_PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`
export const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`

export const IMAGE_FEE = parseUnits("2.0", 18) // 2 CELO
export const NFT_MINT_FEE = parseUnits("3.0", 18) // 3 CELO
```

### Step 4.3: Add Contract ABIs

```typescript
// lib/abis.ts
export { default as imagePaymentAbi } from '../deployments/celo/ZodiacImagePayment.json'
export { default as zodiacNftAbi } from '../deployments/celo/ZodiacNFT.json'
```

## Phase 5: Testing

### Step 5.1: Testnet Testing

```bash
# Deploy to Celo Alfajores testnet first
npx hardhat run scripts/deploy-image-payment.ts --network celo-alfajores
npx hardhat run scripts/upgrade-zodiac-nft-v2.ts --network celo-alfajores
```

### Step 5.2: End-to-End Flow Test

1. **Test Image Payment**:
   - User pays 2 CELO
   - Transaction verified
   - Access token generated
   - Image generated and saved to S3

2. **Test Image Sharing**:
   - Share to Farcaster without NFT
   - Verify image displays in collection as "Generated"

3. **Test NFT Minting**:
   - Convert generated image to NFT (3 CELO)
   - Verify NFT minted
   - Collection updated to "Minted" with ImageToNFT source

4. **Test Direct NFT Mint**:
   - Mint NFT directly (3 CELO) without prior image payment
   - Verify tagged as "DirectMint"

5. **Test Backward Compatibility**:
   - Existing 10 CELO NFTs tagged as "LegacyMint"
   - Collection displays correctly

### Step 5.3: Load Testing

```bash
# Test payment contract under load
npm run test:load-payment

# Test NFT minting under load
npm run test:load-mint

# Test collection queries
npm run test:load-collection
```

## Phase 6: Mainnet Deployment

### Step 6.1: Pre-Deployment Checklist

- [ ] All contracts tested on Alfajores testnet
- [ ] Database schema applied and tested
- [ ] Frontend tested with testnet contracts
- [ ] Treasury address verified
- [ ] Deployment wallet funded with CELO for gas
- [ ] Contract code audited (if budget allows)
- [ ] Backup plan prepared

### Step 6.2: Deploy to Mainnet

```bash
# 1. Deploy ZodiacImagePayment
npx hardhat run scripts/deploy-image-payment.ts --network celo

# 2. Upgrade ZodiacNFT to V2
npx hardhat run scripts/upgrade-zodiac-nft-v2.ts --network celo

# 3. Verify contracts
npx hardhat verify --network celo <IMAGE_PAYMENT_ADDRESS>
npx hardhat verify --network celo <NFT_IMPLEMENTATION_ADDRESS>
```

### Step 6.3: Post-Deployment Verification

```bash
# Check contract states
npx hardhat run scripts/verify-deployment.ts --network celo

# Expected output:
# ✅ ZodiacImagePayment deployed at: 0x...
# ✅ Image fee: 2 CELO
# ✅ Treasury address: 0x...
# ✅ ZodiacNFT upgraded to V2
# ✅ Mint fee: 3 CELO
# ✅ Backward compatibility: Maintained
```

## Phase 7: Migration & Monitoring

### Step 7.1: Migrate Existing Data

```sql
-- Tag existing NFTs as LegacyMint
UPDATE user_collections
SET nft_mint_source = 'LegacyMint'
WHERE collection_type = 'Minted'
  AND nft_mint_timestamp < '<V2_DEPLOYMENT_TIMESTAMP>'
  AND nft_mint_source IS NULL;

-- Update legacy statistics
UPDATE user_statistics
SET
  total_legacy_mints = (
    SELECT COUNT(*) FROM user_collections
    WHERE user_address = user_statistics.user_address
      AND nft_mint_source = 'LegacyMint'
  ),
  total_legacy_payments = (
    SELECT COALESCE(SUM(10.0), 0) FROM user_collections
    WHERE user_address = user_statistics.user_address
      AND nft_mint_source = 'LegacyMint'
  );
```

### Step 7.2: Monitor Contracts

```typescript
// scripts/monitor-contracts.ts
// Monitor events from both contracts
// Track payment flow, mint conversions, and statistics
```

### Step 7.3: Analytics Dashboard

Create dashboard to monitor:
- Total image payments (2 CELO each)
- Total NFT mints (3 CELO each)
- Conversion rate (Generated → Minted)
- Revenue breakdown
- User engagement metrics

## Rollback Plan

If issues arise, contracts can be upgraded again:

```bash
# Rollback ZodiacNFT
npx hardhat run scripts/rollback-zodiac-nft.ts --network celo

# Pause ZodiacImagePayment (add pause functionality if needed)
npx hardhat run scripts/pause-image-payment.ts --network celo
```

## Cost Summary

### Deployment Costs (Estimated)
- ZodiacImagePayment deployment: ~$50-100 USD
- ZodiacNFT V2 upgrade: ~$30-50 USD
- Contract verification: Free
- **Total**: ~$80-150 USD

### User Costs (New System)
- Image generation: 2 CELO (~$1-2)
- NFT minting: 3 CELO (~$1.5-3)
- Total for full flow: 5 CELO (~$2.5-5)

### Savings vs Legacy
- Legacy: 10 CELO for NFT only
- New: 5 CELO for image + NFT
- **50% cost reduction** for users who want both

## Support & Troubleshooting

### Common Issues

1. **"Insufficient CELO sent"**
   - User didn't send enough CELO
   - Check transaction value >= 2 CELO (image) or 3 CELO (NFT)

2. **"Failed to send CELO to treasury"**
   - Treasury address invalid
   - Treasury contract not accepting payments

3. **"Transaction not to payment contract"**
   - User sent to wrong address
   - Verify contract addresses in frontend

4. **"No payment event found"**
   - Transaction didn't emit ImagePaymentReceived event
   - Check transaction logs manually

### Contact

For deployment issues, contact the development team.
