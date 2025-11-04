# Farcaster Network Switching Fix

## Problem

When users try to mint NFTs in the Farcaster Mini App, they get this error:

```
Contract execution failed: The current chain of the wallet (id: 8453) 
does not match the target chain for the transaction (id: 42220 – Celo).
Current Chain ID: 8453 (Base)
Expected Chain ID: 42220 (Celo Mainnet)
```

**Root Cause**: Farcaster wallets connect to Base network (8453) by default, but the ZodiacCard NFT contract is deployed on Celo Mainnet (42220).

---

## Solution Applied

### 1. Enable Multi-Chain Support in Wagmi

**File**: `lib/wagmi.ts`

**Before** (only Celo chain):
```typescript
export const config = createConfig({
  chains: [configuredChain], // Only Celo
  transports,
  // ...
})
```

**After** (Celo + Base chains):
```typescript
import { celo, celoAlfajores, base, baseSepolia } from 'wagmi/chains'

const transports = {
  [celo.id]: http(),
  [celoAlfajores.id]: http(),
  [base.id]: http(),        // Added Base
  [baseSepolia.id]: http(), // Added Base Sepolia
} as const

export const config = createConfig({
  chains: [configuredChain, base, baseSepolia], // Multi-chain support
  transports,
  // ...
})
```

### 2. Fix Automatic Network Switching

**File**: `components/mint-button.tsx`

**Before** (returned early after switch request):
```typescript
if (chainId !== TARGET_CHAIN_ID) {
  setError(`Please switch to ${NETWORK_NAME} to mint`)
  try {
    await switchChain({ chainId: TARGET_CHAIN_ID })
  } catch (error) {
    setError(`Failed to switch to ${NETWORK_NAME}`)
  }
  return // ❌ Stopped here - never minted!
}
```

**After** (waits for switch, then continues):
```typescript
if (chainId !== TARGET_CHAIN_ID) {
  setError(`Switching to ${NETWORK_NAME}...`)
  try {
    await switchChain({ chainId: TARGET_CHAIN_ID })
    // Wait for chain switch to propagate
    await new Promise(resolve => setTimeout(resolve, 1000))
    setError(null)
    // ✅ Continues to mint after successful switch!
  } catch (error) {
    console.error('Failed to switch network:', error)
    setError(`Failed to switch to ${NETWORK_NAME}. Please switch manually and try again.`)
    return // Only return on error
  }
}
```

---

## How It Works Now

### User Flow in Farcaster

1. **User Opens Mini App**
   - Farcaster wallet connects on Base (8453)
   - App detects wrong network

2. **User Clicks "Mint NFT"**
   - App shows: "Switching to Celo Mainnet..."
   - Triggers `switchChain({ chainId: 42220 })`
   - Wallet prompts user to approve network switch

3. **After Switch Approval**
   - App waits 1 second for propagation
   - Automatically continues with IPFS upload
   - Mints NFT on Celo Mainnet

4. **Success**
   - NFT minted on correct network
   - User can view on Blockscout
   - User can share on Warpcast

### Alternative Flow (Manual Switch)

If automatic switching fails:
- "Switch to Celo Mainnet" button appears (yellow)
- User clicks button
- User approves network switch in wallet
- User clicks "Mint NFT" again

---

## Testing

### Test Cases

1. ✅ **Fresh Connection (Base)**
   - Connect wallet → Shows on Base (8453)
   - Click Mint → Auto-switches to Celo (42220)
   - Mint completes successfully

2. ✅ **Already on Celo**
   - Wallet on Celo (42220)
   - Click Mint → Mints immediately
   - No network switch needed

3. ✅ **Switch Failure**
   - Network switch rejected by user
   - Error message shown
   - Manual switch button appears
   - User can retry

4. ✅ **Multiple Mints**
   - First mint → Auto-switches to Celo
   - Second mint → Already on Celo, no switch
   - Smooth experience

---

## Technical Details

### Supported Networks

| Network | Chain ID | Purpose |
|---------|----------|---------|
| Celo Mainnet | 42220 | NFT contract deployment |
| Celo Alfajores | 44787 | Testnet (if configured) |
| Base Mainnet | 8453 | Farcaster default wallet |
| Base Sepolia | 84532 | Base testnet support |

### Network Switch Logic

```typescript
// 1. Detect mismatch
if (chainId !== TARGET_CHAIN_ID) {
  
  // 2. Request switch
  await switchChain({ chainId: TARGET_CHAIN_ID })
  
  // 3. Wait for propagation
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 4. Continue minting
}
```

### Wagmi Hooks Used

- `useChainId()` - Detect current network
- `useSwitchChain()` - Request network switch
- `useAccount()` - Get wallet connection status
- `usePublicClient()` - Interact with blockchain

---

## User Experience Improvements

### Visual Feedback

**Wrong Network**:
```
🟡 Yellow button: "Switch to Celo Mainnet"
⚠️ Error message: "Please switch to Celo Mainnet to mint"
```

**Switching**:
```
🔄 Loading spinner: "Switching to Celo Mainnet..."
```

**Ready to Mint**:
```
✨ Sparkles icon: "Mint NFT • 10.0 CELO"
```

**Minting**:
```
🔄 Loading spinner: "Uploading to IPFS..." → "Minting NFT..."
```

**Success**:
```
✅ Success dialog with NFT image
🔗 "View on Blockscout" button
📱 "Share on Warpcast" button
```

---

## Deployment

### Environment Variables Required

```bash
# Celo Network (Contract deployment)
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_RPC_URL_CELO=https://forno.celo.org
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x415Df58904f56A159748476610B8830db2548158
NEXT_PUBLIC_CELO_MINT_PRICE=10.0

# WalletConnect (Required for wallet connection)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### Build & Deploy

```bash
cd ZodiacCardApp
npm install
npm run build
vercel --prod
```

---

## Known Limitations

1. **User Must Approve Switch**
   - Wallet will prompt user to approve network switch
   - User can reject → Manual switch button appears

2. **Farcaster Wallet Behavior**
   - Some Farcaster wallets may have quirks
   - 1-second delay helps ensure switch propagates

3. **Multiple Chain Support**
   - App supports both Celo and Base
   - Only Celo has the NFT contract
   - Base is for wallet compatibility only

---

## Troubleshooting

### Issue: Network switch rejected

**Solution**: User must approve in wallet, or use manual switch button

### Issue: Still showing wrong network after switch

**Solution**: Refresh page, reconnect wallet

### Issue: Transaction fails after switch

**Solution**: Wait a moment, try again (chain propagation delay)

---

## Future Enhancements

1. **Detect Farcaster Context**
   - Auto-switch on app load if in Farcaster
   - Reduce user friction

2. **Better Error Messages**
   - More specific wallet-based guidance
   - Link to help documentation

3. **Network Switch Confirmation**
   - Show confirmation before auto-switching
   - Let user opt-out of auto-switch

4. **Multi-Network Deployment** (Optional)
   - Deploy contract to Base as well
   - Let users mint on their preferred network

---

## References

- **Wagmi Docs**: https://wagmi.sh/react/guides/chain-switching
- **Viem Docs**: https://viem.sh/docs/chains/introduction
- **Farcaster Frames**: https://docs.farcaster.xyz/developers/frames
- **Celo Network**: https://docs.celo.org

---

**Fixed**: 2024
**Networks**: Celo (42220) + Base (8453)
**Status**: ✅ Working

### 3. Auto-Switch on Wallet Connection

**File**: `components/connect-menu.tsx`

**Added automatic network switching immediately after wallet connection**:

```typescript
// Auto-switch to Celo when wallet connects on wrong network
useEffect(() => {
  if (isConnected) {
    const wrongNetwork = chainId !== TARGET_CHAIN_ID
    
    if (wrongNetwork) {
      const autoSwitch = async () => {
        try {
          setError(`Switching to ${NETWORK_NAME}...`)
          await switchChain({ chainId: TARGET_CHAIN_ID })
          setError(null)
        } catch (switchError) {
          setError(`Please switch to ${NETWORK_NAME}`)
        }
      }
      autoSwitch()
    }
  }
}, [chainId, isConnected, TARGET_CHAIN_ID, NETWORK_NAME, switchChain])
```

**Benefits**:
- ✅ User connects → Automatically switches to Celo
- ✅ User is on correct network BEFORE attempting to mint
- ✅ Reduces friction and potential errors
- ✅ Works for both Farcaster and regular wallets

