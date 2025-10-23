# ✅ ZodiacCardApp - Celo Mainnet Configuration Complete

## 🎯 Configuration Summary

All frontend environment files have been updated with the deployed Celo mainnet contract addresses.

---

## 📋 Updated Files

### 1. `.env` (Development)
```bash
NEXT_PUBLIC_CHAIN_ID="42220" # Celo Mainnet
NEXT_PUBLIC_CELO_MINT_PRICE="1.0"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x415Df58904f56A159748476610B8830db2548158"
```

### 2. `.env.production` (Production)
```bash
NEXT_PUBLIC_CHAIN_ID="42220" # Celo Mainnet
NEXT_PUBLIC_CELO_MINT_PRICE="1.0"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x415Df58904f56A159748476610B8830db2548158"
```

### 3. `.env.example` (Template)
Updated with mainnet addresses as default values

---

## ⚙️ Key Configuration Changes

### Network Configuration
- **Chain ID**: Changed from `44787` (Alfajores) → `42220` (Celo Mainnet)
- **RPC URL**: `https://forno.celo.org`
- **Network**: Celo Mainnet

### Contract Addresses
- **Proxy (Main Contract)**: `0x415Df58904f56A159748476610B8830db2548158`
- **Implementation**: `0xd1846BE5C31604496C63be66CE33Af67d68ecf84`

### Pricing
- **Mint Fee**: Changed from `5.0 CELO` → `1.0 CELO` (matches deployed contract)

---

## 🔧 Wagmi Configuration Verification

The `lib/wagmi.ts` configuration is already set up correctly:

✅ **Auto-detects network** based on `NEXT_PUBLIC_CHAIN_ID`
✅ **Supports Celo mainnet** (chain ID 42220)
✅ **Supports Celo Alfajores** (chain ID 44787)
✅ **Farcaster Frame connector** enabled
✅ **WalletConnect v2** configured
✅ **Custom RPC URLs** from environment variables

```typescript
// Automatically selects chain based on NEXT_PUBLIC_CHAIN_ID
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "44787")
const targetChain = TARGET_CHAIN_ID === 42220 ? celo : celoAlfajores
```

---

## 🚀 Testing Your Frontend

### 1. Start Development Server

```bash
cd ZodiacCardApp
npm run dev
# or
yarn dev
```

### 2. Verify Contract Connection

Open browser console and check:

```javascript
// Check current chain
console.log('Chain ID:', window.ethereum?.chainId)

// Should show: 0xa4ec (42220 in hex)
```

### 3. Test Wallet Connection

1. Click "Connect Wallet" in your app
2. Approve connection to Celo Mainnet
3. Verify wallet shows correct network
4. Check contract address is loaded

### 4. Test Minting (Small Amount)

1. Enter birth details
2. Generate fortune
3. Click "Mint NFT"
4. Verify mint fee shows: **1.0 CELO**
5. Confirm transaction
6. Wait for transaction confirmation

---

## 🔍 Troubleshooting

### Issue: Wrong Network

**Problem**: Wallet shows different network

**Solution**:
```bash
# Verify .env file
cat .env | grep CHAIN_ID
# Should show: NEXT_PUBLIC_CHAIN_ID="42220"

# Restart dev server
npm run dev
```

### Issue: Contract Not Found

**Problem**: Transaction fails with "Contract not found"

**Solution**:
```bash
# Verify contract address in .env
cat .env | grep NFT_CONTRACT
# Should show: NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x415Df58904f56A159748476610B8830db2548158"

# Check on Celoscan
open https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158
```

### Issue: Incorrect Mint Fee

**Problem**: UI shows wrong mint price

**Solution**:
```bash
# Update mint price in .env
NEXT_PUBLIC_CELO_MINT_PRICE="1.0"

# Restart dev server
```

### Issue: RPC Connection Error

**Problem**: "Cannot connect to network"

**Solution**:
```bash
# Verify RPC URL
cat .env | grep RPC_URL_CELO
# Should show: NEXT_PUBLIC_RPC_URL_CELO="https://forno.celo.org"

# Test RPC manually
curl -X POST https://forno.celo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Should return: {"jsonrpc":"2.0","id":1,"result":"0xa4ec"}
```

---

## 📱 Environment Variables Reference

### Required for Frontend

```bash
# Network Configuration
NEXT_PUBLIC_CHAIN_ID="42220"
NEXT_PUBLIC_RPC_URL_CELO="https://forno.celo.org"

# Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x415Df58904f56A159748476610B8830db2548158"

# Pricing
NEXT_PUBLIC_CELO_MINT_PRICE="1.0"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

### Optional (Already Configured)

```bash
# IPFS/Storage
PINATA_API_KEY="your-key"
AWS_ACCESS_KEY_ID="your-key"

# AI
OPENAI_API_KEY="your-key"
```

---

## 🎨 Frontend Features Ready

### ✅ Wallet Connection
- Farcaster Frame connector
- WalletConnect v2
- Injected wallets (MetaMask, etc.)

### ✅ Network Switching
- Auto-detects Celo mainnet (42220)
- Prompts user to switch if wrong network

### ✅ NFT Minting
- Shows correct 1.0 CELO price
- Connects to deployed contract
- Uploads metadata to IPFS
- Generates on-chain transaction

### ✅ Transaction Tracking
- Real-time transaction status
- Block confirmations
- Error handling
- Success notifications

---

## 🔗 Important Links

**Contract on Celoscan**:
https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158

**Celo Network Info**:
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io
- Native Token: CELO (18 decimals)

**Farcaster Frame Integration**:
- Mini Apps: https://miniapps.farcaster.xyz
- Frame SDK: https://docs.farcaster.xyz/developers/frames

---

## 📊 Production Deployment Checklist

Before deploying to production:

- [ ] Verify `.env.production` has correct values
- [ ] Test minting on mainnet with small amount (1 CELO)
- [ ] Verify NFT appears in wallet after minting
- [ ] Check IPFS metadata loads correctly
- [ ] Test on mobile devices (Celo is mobile-first)
- [ ] Verify Farcaster Frame integration works
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure analytics (PostHog, etc.)
- [ ] Test with different wallets (Valora, MetaMask, etc.)
- [ ] Verify all environment variables are set in hosting platform

---

## 🎉 Ready to Launch!

Your ZodiacCardApp frontend is now configured for Celo mainnet and ready to mint NFTs!

**Contract**: `0x415Df58904f56A159748476610B8830db2548158`
**Network**: Celo Mainnet (42220)
**Mint Fee**: 1.0 CELO

### Next Steps:

1. **Test locally**: `cd ZodiacCardApp && npm run dev`
2. **Test minting**: Mint a test NFT with 1.0 CELO
3. **Deploy**: Deploy to Vercel/Netlify with production env vars
4. **Monitor**: Set up monitoring and analytics

---

**Configuration completed**: ✅
**Status**: Ready for production 🚀
