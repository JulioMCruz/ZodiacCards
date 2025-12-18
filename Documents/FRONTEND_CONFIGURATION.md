# ZodiacCardApp - Frontend Configuration Guide

## Configuration Summary

Frontend environment configuration for V3 contracts on Celo Mainnet with promotional pricing.

---

## Current Contract Addresses (V3 - Active)

### Production Configuration

```bash
# Network
NEXT_PUBLIC_CHAIN_ID="42220"                    # Celo Mainnet
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo.org"

# V3 Contracts (Active)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x3ff2E08339588c594E6155Fd088f9668b2E7c775"
NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS="0x3ff2E08339588c594E6155Fd088f9668b2E7c775"
NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS="0x3b433190AD6dB27461f6a118AcfcDFfa0E1D491b"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS="0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3"

# V2 Contracts (Legacy - Read-only)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_V2="0x415Df58904f56A159748476610B8830db2548158"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS_V2="0x52e4212bd4085296168A7f880DfB6B646d52Fe61"

# Pricing (Promotional)
NEXT_PUBLIC_IMAGE_FEE="1.0"                     # 1.0 CELO per fortune
NEXT_PUBLIC_CELO_MINT_PRICE="2.0"               # 2.0 CELO per mint
```

---

## Pricing Structure

### Current Pricing (December 2025 Promotion)

| Step | Action | Cost | Contract |
|------|--------|------|----------|
| 1 | Generate Fortune Image | **1.0 CELO** | Payment V3 (`0x2e73...51f3`) |
| 2 | Mint NFT | **2.0 CELO** | NFT V3 (`0x3ff2...c775`) |
| **Total** | Complete flow | **3.0 CELO** | - |

### Fee Configuration

The image generation fee is configurable via the Payment Contract:

```solidity
// Owner can update fee
function setImageFee(uint256 newFee) external onlyOwner
```

Current on-chain fee: **1.0 CELO** (updated December 2025)

---

## Contract Evolution

| Version | Status | NFT Contract | Payment Contract | Image Fee | Mint Fee |
|---------|--------|--------------|------------------|-----------|----------|
| **V3** | ✅ Active | `0x3ff2...c775` | `0x2e73...51f3` | 1.0 CELO | 2.0 CELO |
| **V2** | 🔒 Legacy | `0x415D...8158` | `0x52e4...e61` | 2.0 CELO | 10.0 CELO |

**Note**: V2 contracts are read-only for backward compatibility (viewing legacy NFTs in collection).

---

## Seasonal Themes Configuration

### Theme Availability

| Theme | Availability | Dates |
|-------|-------------|-------|
| Classic Zodiac (⭐) | Always | Year-round |
| Winter Holidays (🎄) | December | Dec 1 - Dec 31 |
| New Year (🎆) | Holiday Season | Dec 15 - Jan 20 |

### Theme Implementation

Themes are implemented client-side via prompt modifiers in `lib/seasonal-themes.ts`:

```typescript
// Check theme availability
isThemeAvailable('winter-holidays')  // true in December
isThemeAvailable('new-year')         // true Dec 15 - Jan 20

// Build themed prompt
buildSeasonalPrompt(basePrompt, selectedTheme)
```

---

## Wagmi Configuration

The `lib/wagmi.ts` configuration auto-detects network based on environment:

```typescript
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "44787")
const targetChain = TARGET_CHAIN_ID === 42220 ? celo : celoAlfajores
```

### Supported Connectors

- Farcaster Frame connector (primary)
- WalletConnect v2
- Injected wallets (MetaMask, Valora, etc.)

---

## Testing Your Configuration

### 1. Start Development Server

```bash
cd ZodiacCardApp
pnpm dev
```

### 2. Verify Contract Connection

Open browser console:

```javascript
console.log('Chain ID:', window.ethereum?.chainId)
// Should show: 0xa4ec (42220 in hex)
```

### 3. Test Payment Flow

1. Connect wallet to Celo Mainnet
2. Select zodiac type and enter birth details
3. Choose seasonal theme (if available)
4. Click "Reveal My Fortune" - verify shows **1.0 CELO**
5. After image generation, click "Mint NFT" - verify shows **2.0 CELO**

---

## Environment Variables Reference

### Required Variables

```bash
# Network
NEXT_PUBLIC_CHAIN_ID="42220"
NEXT_PUBLIC_CELO_RPC_URL="https://forno.celo.org"

# V3 Contracts
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x3ff2E08339588c594E6155Fd088f9668b2E7c775"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS="0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3"

# Pricing
NEXT_PUBLIC_IMAGE_FEE="1.0"
NEXT_PUBLIC_CELO_MINT_PRICE="2.0"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
```

### Optional Variables

```bash
# V2 Legacy Support
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_V2="0x415Df58904f56A159748476610B8830db2548158"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS_V2="0x52e4212bd4085296168A7f880DfB6B646d52Fe61"

# Self Protocol
NEXT_PUBLIC_SELF_APP_NAME="Zodiac Card"
NEXT_PUBLIC_SELF_SCOPE="zodiac-card-app"

# Divvi Referral
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS="your-divvi-address"
```

---

## Troubleshooting

### Issue: Button Shows Wrong Price

**Problem**: "Reveal My Fortune" shows 2.0 CELO instead of 1.0 CELO

**Solution**:
1. Check `NEXT_PUBLIC_IMAGE_FEE` in `.env.local` (should be "1.0")
2. For Vercel: Update environment variable in dashboard
3. Redeploy the frontend

### Issue: Wrong Network

**Problem**: Wallet shows different network

**Solution**:
```bash
# Verify .env file
cat .env.local | grep CHAIN_ID
# Should show: NEXT_PUBLIC_CHAIN_ID="42220"

# Restart dev server
pnpm dev
```

### Issue: Contract Not Found

**Problem**: Transaction fails with "Contract not found"

**Solution**:
```bash
# Verify V3 contract address
cat .env.local | grep NFT_CONTRACT_ADDRESS
# Should show V3: 0x3ff2E08339588c594E6155Fd088f9668b2E7c775

# Check on Celoscan
open https://celoscan.io/address/0x3ff2E08339588c594E6155Fd088f9668b2E7c775
```

### Issue: Seasonal Theme Not Available

**Problem**: Winter Holidays or New Year theme not showing

**Solution**:
- Winter Holidays: Only available in December
- New Year: Only available Dec 15 - Jan 20
- Check system date/timezone settings

---

## Important Links

**V3 Contracts on Celoscan**:
- NFT: https://celoscan.io/address/0x3ff2E08339588c594E6155Fd088f9668b2E7c775
- Payment: https://celoscan.io/address/0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3

**Celo Network Info**:
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io
- Native Token: CELO (18 decimals)

---

## Configuration Checklist

Before deployment:

- [ ] Verify `NEXT_PUBLIC_IMAGE_FEE="1.0"` (promotional pricing)
- [ ] Verify `NEXT_PUBLIC_CELO_MINT_PRICE="2.0"`
- [ ] Verify V3 contract addresses are set
- [ ] Test fortune generation shows 1.0 CELO
- [ ] Test NFT minting shows 2.0 CELO
- [ ] Verify seasonal themes appear correctly
- [ ] Test on mobile devices
- [ ] Set all environment variables in Vercel

---

**Last Updated**: December 2025
**Status**: V3 Active with Promotional Pricing
