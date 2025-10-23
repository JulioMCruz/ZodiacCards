# 🚀 ZodiacCards - Quick Start Guide

Get your ZodiacCards app running in 5 minutes!

## ⚡ Prerequisites

- Node.js 18+ installed
- Wallet with 2+ CELO on Celo Mainnet
- Basic terminal/command line knowledge

## 🎯 Quick Setup

### 1. Install Dependencies (1 minute)

```bash
cd ZodiacCardApp
npm install
```

### 2. Configure Environment (1 minute)

Copy the environment file:
```bash
cp .env.example .env
```

The `.env` file is already configured for Celo Mainnet! Just verify these key values:

```bash
# Core Configuration (already set)
NEXT_PUBLIC_CHAIN_ID="42220"
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x415Df58904f56A159748476610B8830db2548158"
NEXT_PUBLIC_CELO_MINT_PRICE="1.0"

# Add your API keys (required for full functionality)
OPENAI_API_KEY="your-openai-key-here"
PINATA_API_KEY="your-pinata-key-here"
PINATA_SECRET_KEY="your-pinata-secret-here"
```

**Note**: The app will work for testing without API keys, but fortune generation and IPFS upload won't function.

### 3. Start Development Server (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Connect Wallet & Test (2 minutes)

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve connection in MetaMask/wallet
   - Switch to Celo Mainnet when prompted

2. **Generate Fortune**
   - Enter your birth date and time
   - Select zodiac type (Western recommended for testing)
   - Click "Generate Fortune"

3. **Mint NFT** (costs ~1.01 CELO)
   - Click "Mint NFT • 1.0 CELO"
   - Wait for IPFS upload (~30 seconds)
   - Approve transaction in wallet
   - Wait for confirmation (~10 seconds)
   - Success! 🎉

## ✅ Verify It Works

### Check Your NFT

1. **In Wallet**
   - Open MetaMask
   - Go to "NFTs" tab
   - Look for "Zodiac NFT #[ID]"

2. **On Celoscan**
   ```
   https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158
   ```
   - Click "Transactions" tab
   - Find your mint transaction
   - Status should be "Success" ✅

3. **On Blockscout** (after 30 minutes)
   ```
   https://celo.blockscout.com/token/0x415df58904f56a159748476610b8830db2548158/[TOKEN_ID]
   ```

## 🐛 Quick Troubleshooting

### "Please switch to Celo Mainnet"
**Fix**: Click the button to auto-switch, or manually add Celo network:
- Network Name: Celo Mainnet
- RPC URL: `https://forno.celo.org`
- Chain ID: `42220`
- Currency: CELO
- Block Explorer: `https://celoscan.io`

### "Insufficient CELO balance"
**Fix**: You need at least 1.05 CELO (1.0 mint + 0.05 gas)
- Buy CELO on exchange
- Bridge from another chain
- Or use Celo Alfajores testnet for free testing

### "Failed to upload to IPFS"
**Fix**: Add your Pinata API keys to `.env`
```bash
PINATA_API_KEY="your-key"
PINATA_SECRET_KEY="your-secret"
```
Get free keys at: https://pinata.cloud

### Fortune generation fails
**Fix**: Add OpenAI API key to `.env`
```bash
OPENAI_API_KEY="your-openai-key"
```
Get API key at: https://platform.openai.com

## 📱 Using with Farcaster

### As a Farcaster Frame
The app works natively as a Farcaster Mini App:

1. Deploy to production (Vercel/Netlify)
2. Share your production URL on Warpcast
3. Users can mint directly in Farcaster!

### Share Your Mint
After minting, click "Share" to post to Warpcast with:
- Your fortune card image
- Zodiac details
- Blockscout link

## 🎓 Learn More

- **Full Documentation**: See [README.md](./README.md)
- **Deployment Guide**: See [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md)
- **Integration Testing**: See [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)
- **Complete Summary**: See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

## 🔗 Important Links

- **Contract**: https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158
- **Celo Network**: https://celo.org
- **Farcaster**: https://farcaster.xyz
- **Get CELO**: https://celo.org/buy

## 💡 Pro Tips

1. **Test on Alfajores first** (free testnet):
   - Change `NEXT_PUBLIC_CHAIN_ID` to `44787`
   - Get test CELO from faucet
   - Verify everything works

2. **Get API keys early**:
   - OpenAI for fortune generation
   - Pinata for IPFS storage
   - Both offer free tiers

3. **Monitor gas costs**:
   - Typical mint: 1.01-1.05 CELO
   - Most cost goes to treasury (1.0 CELO)
   - Gas is cheap on Celo (~0.01-0.05)

4. **Development workflow**:
   ```bash
   # Watch for changes
   npm run dev

   # Build for production
   npm run build

   # Start production server
   npm start
   ```

## ✨ Next Steps

1. ✅ Complete a test mint
2. ✅ Verify on Celoscan
3. ✅ Check NFT in wallet
4. ⬜ Deploy to production
5. ⬜ Share on Warpcast
6. ⬜ Build your fortune collection!

---

**Need Help?** Check the [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) for detailed testing steps.

**Ready to Deploy?** See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for production deployment guide.

---

**Happy Minting! 🔮✨**
