# ZodiacCards - Celo Mainnet Deployment Guide

## ✅ Pre-Deployment Checklist

All contract updates have been completed. The deployment script now correctly uses native CELO tokens (18 decimals) with a 5 CELO mint fee.

## 📋 Requirements

1. **Node.js** >= v20.18.3
2. **Yarn** (v1 or v2+)
3. **Wallet** with sufficient CELO for:
   - Deployment gas fees (~0.5-1 CELO)
   - Initial testing (~5-10 CELO for test mints)

## 🔧 Setup Instructions

### Step 1: Navigate to Hardhat Directory

```bash
cd ZodiacCardContracts/packages/hardhat
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your configuration:

```bash
# REQUIRED: Your deployer wallet address (receives contract ownership)
DEPLOYER_ADDRESS=0xYourWalletAddress

# REQUIRED: Treasury wallet address (receives minting fees)
TREASURY_ADDRESS=0xYourTreasuryAddress

# OPTIONAL: Mint fee in CELO (default: 5.0)
CELO_MINT_FEE=5.0

# OPTIONAL: For contract verification on Celoscan
CELOSCAN_API_KEY=your_celoscan_api_key

# OPTIONAL: Auto-verify on deployment
VERIFY_ON_DEPLOY=true
```

### Step 4: Import Your Private Key

**IMPORTANT**: Never hardcode your private key in `.env` file!

Use the secure import script:

```bash
yarn account:import
```

This will prompt you to enter your private key securely and store it in `.env` as `__RUNTIME_DEPLOYER_PRIVATE_KEY`.

Alternatively, you can set it manually (not recommended for production):

```bash
# Add to .env
__RUNTIME_DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere
```

### Step 5: Verify Configuration

Ensure your wallet has enough CELO:

```bash
# Check your account
yarn account
```

## 🚀 Deployment

### Deploy to Celo Mainnet

```bash
yarn deploy --network celo
```

Expected output:
```
👤 Using owner address: 0x...
💰 Using treasury address: 0x...

📝 Deployment Configuration:
- Name: Zodiac NFT
- Symbol: ZODIAC
- Mint Fee: 5.0 CELO

🚀 Deploying ZodiacNFT...
✅ Deployment completed successfully!

📝 ZodiacNFT Contract Info:
⚡️ Proxy Address: 0x...
⚡️ Implementation Address: 0x...
⚡️ Owner: 0x...
⚡️ Treasury: 0x...
⚡️ Mint Fee: 5.0 CELO
```

### Save Deployment Addresses

After deployment, save the contract addresses:

```bash
# Add to .env
PROXY_CONTRACT_ADDRESS=0xProxyAddressFromDeployment
IMPLEMENTATION_CONTRACT_ADDRESS=0xImplementationAddressFromDeployment
```

## 🔍 Contract Verification

If `VERIFY_ON_DEPLOY=true` and `CELOSCAN_API_KEY` is set, verification happens automatically.

Manual verification:

```bash
yarn hardhat verify --network celo <IMPLEMENTATION_ADDRESS>
```

View on Celoscan:
- Proxy: `https://celoscan.io/address/<PROXY_ADDRESS>`
- Implementation: `https://celoscan.io/address/<IMPLEMENTATION_ADDRESS>`

## 🧪 Testing Deployment

### Test Minting

```bash
# Using Hardhat console
yarn hardhat console --network celo
```

```javascript
const ZodiacNFT = await ethers.getContractFactory("ZodiacNFT");
const nft = await ZodiacNFT.attach("PROXY_ADDRESS");

// Check mint fee
const fee = await nft.mintFee();
console.log("Mint fee:", ethers.formatUnits(fee, 18), "CELO");

// Test mint (replace with your address and metadata URI)
const tx = await nft.mint(
  "0xYourAddress",
  "ipfs://your-metadata-uri",
  { value: ethers.parseUnits("5.0", 18) }
);
await tx.wait();
console.log("NFT minted!");
```

## 📊 Contract Details

### Contract Architecture

- **Type**: ERC721 Upgradeable NFT
- **Proxy Pattern**: UUPS (Universal Upgradeable Proxy Standard)
- **Royalties**: ERC2981 - 2.5% default royalty
- **Payment**: Native CELO tokens (18 decimals)
- **Mint Fee**: 5.0 CELO (configurable by owner)

### Key Functions

**User Functions**:
- `mint(address to, string memory metadataURI) payable` - Mint new NFT (requires 5 CELO)
- `tokenURI(uint256 tokenId)` - Get metadata URI for token
- `nextTokenId()` - Get next token ID to be minted

**Owner Functions**:
- `setMintFee(uint256 newFee)` - Update mint fee
- `setTreasuryAddress(address payable newTreasury)` - Update treasury
- `upgradeTo(address newImplementation)` - Upgrade contract

## 🔐 Security Considerations

1. **Private Key Management**:
   - Never commit `.env` to git
   - Use hardware wallet for production deployments
   - Rotate deployer keys after deployment

2. **Treasury Security**:
   - Use multi-sig wallet for treasury
   - Regularly monitor treasury balance
   - Set up alerts for large transactions

3. **Contract Upgrades**:
   - Test upgrades on testnet first
   - Use timelock for mainnet upgrades
   - Maintain upgrade documentation

## 📱 Frontend Integration

Update your frontend environment variables:

```bash
# ZodiacCardApp/.env.local
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=<PROXY_ADDRESS>
NEXT_PUBLIC_RPC_URL_CELO=https://forno.celo.org
```

## 🛠️ Troubleshooting

### Deployment Failed

**Error**: "Insufficient CELO"
- Ensure deployer wallet has at least 1-2 CELO for gas

**Error**: "Treasury address not set"
- Verify `TREASURY_ADDRESS` in `.env`

**Error**: "Private key not set"
- Run `yarn account:import` to set private key

### Verification Failed

**Error**: "API key not set"
- Get API key from https://celoscan.io/myapikey
- Add to `.env` as `CELOSCAN_API_KEY`

**Error**: "Contract already verified"
- This is safe to ignore, contract is verified

## 📞 Support

- **Celo Documentation**: https://docs.celo.org
- **Celoscan**: https://celoscan.io
- **Farcaster Mini Apps**: https://miniapps.farcaster.xyz

## 🎉 Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Proxy address saved
- [ ] Implementation verified on Celoscan
- [ ] Test mint completed successfully
- [ ] Treasury receiving funds correctly
- [ ] Frontend environment variables updated
- [ ] Contract ownership transferred (if needed)
- [ ] Backup deployment addresses securely

---

**Network Details**:
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io
- Native Token: CELO (18 decimals)
