# 🚀 Celo Mainnet Deployment Guide

Complete guide for deploying ZodiacImagePayment and upgrading ZodiacNFT to V2 on Celo Mainnet.

## 📋 Prerequisites

- [x] Hardhat and OpenZeppelin dependencies installed
- [x] Deployment scripts created
- [x] Contracts compiled and tested
- [ ] CELO tokens for gas fees (~1 CELO recommended)
- [ ] Private key with deployment authority
- [ ] CeloScan API key for verification

## 🔧 Environment Setup

### Step 1: Create .env File

Copy the deployment template and fill in your values:

```bash
cp .env.deployment .env
```

### Step 2: Configure Environment Variables

Edit `.env` with your actual values:

```env
# Private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here

# Celo RPC URLs
CELO_RPC_URL=https://forno.celo.org
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# CeloScan API Key (get from https://celoscan.io/myapikey)
CELOSCAN_API_KEY=your_api_key_here

# Treasury Address (receives all payments)
TREASURY_ADDRESS=your_treasury_address_here

# Contract Owner Address (can upgrade contracts)
OWNER_ADDRESS=your_owner_address_here

# Existing ZodiacNFT Proxy Address
EXISTING_NFT_PROXY=0x415Df58904f56A159748476610B8830db2548158
```

### Step 3: Verify Configuration

Check your deployer balance:

```bash
npx hardhat run scripts/check-balance.ts --network celo
```

## 📦 Deployment Process

### Phase 1: Deploy ZodiacImagePayment

Deploy the new image payment contract:

```bash
npx hardhat run scripts/deploy-image-payment.ts --network celo
```

**Expected Output:**
```
🚀 Deploying ZodiacImagePayment contract to Celo Mainnet...

📋 Deployment Configuration:
   Treasury Address: 0x...
   Owner Address: 0x...

🔑 Deployer Address: 0x...
💰 Deployer Balance: 5.0 CELO

📦 Deploying ZodiacImagePayment proxy and implementation...
✅ ZodiacImagePayment deployed successfully!

📍 Contract Addresses:
   Proxy Address: 0x...
   Implementation Address: 0x...

🔍 Verifying deployment...
   Image Fee: 2.0 CELO
   Treasury: 0x...
   Owner: 0x...

==========================================================
📝 DEPLOYMENT SUMMARY
==========================================================
Proxy Address: 0x...
Implementation Address: 0x...
Network: Celo Mainnet (42220)
Transaction Fee: 0.05 CELO
==========================================================
```

**Save the Proxy Address** - you'll need it for frontend configuration.

### Phase 2: Verify ZodiacImagePayment on CeloScan

Verify the implementation contract:

```bash
npx hardhat verify --network celo <IMPLEMENTATION_ADDRESS>
```

### Phase 3: Upgrade ZodiacNFT to V2

Upgrade the existing NFT contract:

```bash
npx hardhat run scripts/upgrade-zodiac-nft.ts --network celo
```

**Expected Output:**
```
🔄 Upgrading ZodiacNFT to V2 on Celo Mainnet...

📋 Upgrade Configuration:
   Existing Proxy Address: 0x415Df58904f56A159748476610B8830db2548158

🔑 Deployer Address: 0x...
💰 Deployer Balance: 4.95 CELO

🔍 Verifying existing proxy...
   Current Mint Fee: 10.0 CELO
   Current Owner: 0x...

📦 Deploying ZodiacNFT V2 implementation...
✅ ZodiacNFT upgraded successfully!

📍 Contract Addresses:
   Proxy Address (unchanged): 0x415Df58904f56A159748476610B8830db2548158
   New Implementation Address: 0x...

💰 Updating mint fee to 3 CELO...
✅ Mint fee updated successfully!

🔍 Verifying upgrade...
   Mint Fee: 3.0 CELO
   Owner: 0x...
   Next Token ID: 123

==========================================================
📝 UPGRADE SUMMARY
==========================================================
Proxy Address: 0x415Df58904f56A159748476610B8830db2548158
New Implementation: 0x...
Network: Celo Mainnet (42220)
New Mint Fee: 3 CELO
Transaction Fee: 0.03 CELO
==========================================================
```

### Phase 4: Verify ZodiacNFT V2 on CeloScan

Verify the new implementation:

```bash
npx hardhat verify --network celo <NEW_IMPLEMENTATION_ADDRESS>
```

## 🔐 Security Checklist

Before deploying to mainnet:

- [ ] All contracts compiled without errors
- [ ] Security audit completed (or SECURITY_AUDIT.md reviewed)
- [ ] Private key secured and never committed to git
- [ ] Treasury address confirmed and controlled
- [ ] Owner address has secure multi-sig setup (recommended)
- [ ] Sufficient CELO balance for deployment (~1 CELO)
- [ ] Backup of .env file in secure location
- [ ] Test deployment on Alfajores testnet first

## 📱 Frontend Configuration

### Update .env.local

Add the new contract addresses to your `.env.local`:

```env
# Payment System Configuration
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS=<ZODIAC_IMAGE_PAYMENT_PROXY>
NEXT_PUBLIC_IMAGE_FEE=2.0

# NFT Configuration (proxy address remains same)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x415Df58904f56A159748476610B8830db2548158
NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS=<NEW_IMPLEMENTATION_ADDRESS>
NEXT_PUBLIC_CELO_MINT_PRICE=3.0

# Contract ABIs (already in project)
# contracts/abis/ZodiacImagePayment.json
# contracts/abis/ZodiacNFT.json
```

### Update Contract Addresses in Code

Update the contract addresses in your frontend code:

1. `lib/contracts/addresses.ts` - Add new ZodiacImagePayment address
2. `lib/contracts/abis.ts` - Import new ABI files
3. `app/config/contracts.ts` - Update contract configuration

## 🧪 Testing Deployed Contracts

### Test Image Payment

```bash
# Test payment function
npx hardhat run scripts/test-image-payment.ts --network celo
```

### Test NFT Minting

```bash
# Test V2 minting
npx hardhat run scripts/test-zodiac-nft.ts --network celo
```

### Test Full User Flow

```bash
# Test complete user journey
npx hardhat run scripts/test-user-flow.ts --network celo
```

## 📊 Post-Deployment Monitoring

### Check Contract Stats

```typescript
// Get payment statistics
const totalPayments = await imagePayment.totalPayments();
const totalFeesCollected = await imagePayment.totalFeesCollected();

// Get NFT statistics
const nextTokenId = await zodiacNFT.nextTokenId();
const currentFee = await zodiacNFT.mintFee();
```

### Monitor Events

```typescript
// Listen for payment events
imagePayment.on("ImagePaymentReceived", (user, paymentId, amount, timestamp) => {
  console.log(`Payment ${paymentId} received from ${user}: ${ethers.formatEther(amount)} CELO`);
});

// Listen for NFT mints
zodiacNFT.on("NFTMinted", (to, tokenId, uri, source, imagePaymentId) => {
  console.log(`NFT ${tokenId} minted to ${to} from source ${source}`);
});
```

## 🔄 Rollback Plan

If issues are detected after deployment:

### Rollback NFT Upgrade

```bash
# Deploy previous implementation
npx hardhat run scripts/rollback-zodiac-nft.ts --network celo
```

### Pause Contracts

```bash
# Pause ZodiacImagePayment
npx hardhat run scripts/pause-image-payment.ts --network celo

# Pause ZodiacNFT
npx hardhat run scripts/pause-zodiac-nft.ts --network celo
```

## 📈 Contract Upgrade Path

Future upgrades can be performed using:

```bash
# Upgrade ZodiacImagePayment to V2
npx hardhat run scripts/upgrade-image-payment-v2.ts --network celo

# Upgrade ZodiacNFT to V3
npx hardhat run scripts/upgrade-zodiac-nft-v3.ts --network celo
```

## 🛠️ Troubleshooting

### Common Issues

**Issue: Insufficient balance**
```
Error: sender doesn't have enough funds
```
Solution: Add more CELO to deployer address

**Issue: Nonce too low**
```
Error: nonce has already been used
```
Solution: Wait for previous transaction to complete or reset nonce

**Issue: Contract verification failed**
```
Error: Verification failed
```
Solution: Ensure constructor arguments match deployment

**Issue: Not contract owner**
```
Error: Ownable: caller is not the owner
```
Solution: Deploy with owner private key

### Get Help

- Celo Documentation: https://docs.celo.org
- Hardhat Documentation: https://hardhat.org/docs
- OpenZeppelin Upgrades: https://docs.openzeppelin.com/upgrades-plugins
- CeloScan: https://celoscan.io

## ✅ Deployment Checklist

- [ ] Environment configured (.env)
- [ ] Sufficient CELO balance (~1 CELO)
- [ ] ZodiacImagePayment deployed
- [ ] ZodiacImagePayment verified on CeloScan
- [ ] ZodiacNFT upgraded to V2
- [ ] ZodiacNFT V2 verified on CeloScan
- [ ] Frontend .env.local updated
- [ ] Contract addresses updated in code
- [ ] Test transactions completed
- [ ] Monitoring setup configured
- [ ] Documentation updated
- [ ] Team notified of new addresses

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ Both contracts deployed and verified
2. ✅ Image payment accepts 2 CELO
3. ✅ NFT minting works at 3 CELO
4. ✅ Legacy NFTs still accessible
5. ✅ Collection tracking functional
6. ✅ All events emitting correctly
7. ✅ Frontend integration working
8. ✅ No security vulnerabilities detected

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
**Network:** Celo Mainnet (42220)
