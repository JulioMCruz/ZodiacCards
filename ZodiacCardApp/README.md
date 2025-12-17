# 🔮 Zodiac Card - Frontend Application

> Next.js 15 application for generating personalized Zodiac fortunes and minting them as NFTs on Celo Mainnet.

## 🌟 Overview

This is the frontend application for Zodiac Card, a Farcaster Mini App that combines AI-powered fortune telling with NFT minting on the Celo blockchain. Built with Next.js 15, React 19, and modern Web3 technologies.

## 🚀 Features

### Core Functionality
- 🎴 **NFT Minting**: Mint unique Zodiac Fortune NFTs for 2.0 CELO
- 🔮 **AI Fortune Generation**: Powered by OpenAI GPT-4 via OpenRouter
- 🖼️ **AI Image Generation**: Flux Pro via Replicate for high-quality fortune card images
- 💳 **Two-Tier Payment System**:
  - Image Generation: 2.0 CELO (via Payment Contract)
  - NFT Minting: 2.0 CELO (via NFT Contract)
- 📱 **Farcaster Mini App**: Native integration with Farcaster Frames
- 🌐 **Multi-Contract Support**: Backward compatible with V1/V2 NFTs

### Zodiac Systems
- ⭐ **Western Zodiac**: 12 zodiac signs based on birth date
- 🐉 **Chinese Zodiac**: 12 animals based on birth year
- 🕉️ **Vedic Astrology**: Nakshatra system
- 🌺 **Mayan Calendar**: Tzolkin day signs

### Advanced Features
- 🔐 **Self Protocol**: Privacy-preserving date of birth verification using zero-knowledge proofs
- 🎯 **Divvi Integration**: On-chain referral tracking
- 📊 **Collection Management**: View all minted NFTs and generated fortunes
- 🔄 **IPFS Storage**: Decentralized metadata and image storage via Pinata
- ☁️ **AWS S3**: Backup storage for generated images

## 📦 Tech Stack

### Frontend Framework
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: High-quality component library
- **Radix UI**: Unstyled accessible components

### Web3 Integration
- **Viem v2**: TypeScript interface for Ethereum
- **Wagmi v2**: React hooks for Ethereum
- **Wallet Connect**: Multi-wallet support
- **Celo Network**: Mainnet deployment (Chain ID: 42220)

### AI & External Services
- **OpenRouter**: GPT-4 fortune generation
- **Replicate**: Flux Pro image generation
- **Pinata**: IPFS pinning service
- **AWS S3**: Cloud storage

### Privacy & Security
- **Self Protocol (@selfxyz/core)**: ZK-proof verification
- **Self QR SDK (@selfxyz/qrcode)**: Frontend identity SDK

### Farcaster Integration
- **Farcaster Frames SDK v0.0.34**: Mini App functionality
- **Frame Metadata**: Social sharing optimization

## 🏗️ Project Structure

```
ZodiacCardApp/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── generate-fortune/   # OpenRouter GPT-4 fortune generation
│   │   ├── generate-image/     # Replicate Flux Pro image generation
│   │   ├── upload-to-ipfs/     # Pinata IPFS upload
│   │   ├── upload-to-s3/       # AWS S3 backup upload
│   │   ├── upload-metadata/    # NFT metadata to IPFS
│   │   ├── upload-generation-metadata/ # Fortune metadata to IPFS
│   │   ├── store-generation/   # On-chain fortune storage
│   │   ├── payment/verify/     # Payment verification
│   │   ├── verify-self/        # Self Protocol verification
│   │   ├── nft-image/[hash]/   # NFT image proxy
│   │   └── frame/              # Farcaster Frame endpoint
│   ├── collection/             # NFT collection page
│   ├── mint/[id]/              # NFT minting page
│   ├── fortune/                # Fortune generation flow
│   └── result/                 # NFT result display
├── components/                  # React components
│   ├── ui/                     # Shadcn UI components
│   ├── header.tsx              # App header with wallet
│   ├── mint-button.tsx         # NFT minting logic
│   ├── collection-loading.tsx  # Loading states
│   ├── nft-share-button.tsx    # Social sharing
│   └── share-button.tsx        # Fortune sharing
├── lib/                        # Utilities
│   ├── abis.ts                # Smart contract ABIs
│   ├── constants.ts           # Contract addresses & config
│   └── utils.ts               # Helper functions
├── providers/                  # Context providers
│   └── WagmiProvider.tsx      # Web3 configuration
├── services/                   # Business logic
│   ├── ipfs.ts                # IPFS upload service
│   └── metadata.ts            # Metadata generation
├── public/                     # Static assets
│   ├── .well-known/           # Farcaster manifest
│   └── [images]               # Marketing assets
└── contracts/                  # Contract reference files
    └── ZodiacNFT_V2.sol       # Reference contract
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# Network Configuration
NEXT_PUBLIC_CHAIN_ID="42220" # Celo Mainnet

# V3 Smart Contracts (Current - Active)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0x3ff2E08339588c594E6155Fd088f9668b2E7c775"
NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS="0x3ff2E08339588c594E6155Fd088f9668b2E7c775"
NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS="0x3b433190AD6dB27461f6a118AcfcDFfa0E1D491b"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS="0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3"

# V2 Smart Contracts (Legacy - Read-Only)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_V2="0x415Df58904f56A159748476610B8830db2548158"
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS_V2="0x52e4212bd4085296168A7f880DfB6B646d52Fe61"

# Pricing (2.0 CELO for both image generation and minting)
NEXT_PUBLIC_CELO_MINT_PRICE="2.0"
NEXT_PUBLIC_IMAGE_FEE="2.0"

# RPC URLs
NEXT_PUBLIC_RPC_URL_CELO="https://forno.celo.org"
NEXT_PUBLIC_RPC_URL_CELO_SEPOLIA="https://alfajores-forno.celo-testnet.org"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"

# AI Services
OPENROUTER_API_KEY="your-openrouter-api-key"
REPLICATE_API_TOKEN="your-replicate-api-token"

# IPFS (Pinata)
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"
NEXT_PUBLIC_PINATA_GATEWAY="https://your-gateway.mypinata.cloud"

# AWS S3 (Backup Storage)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket"
AWS_S3_BUCKET_DIRECTORY="ZodiacAssets"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://www.zodiaccard.xyz"
NEXT_PUBLIC_IMAGE_URL="https://your-cdn.com/banner.png"
NEXT_PUBLIC_SPLASH_IMAGE_URL="https://your-cdn.com/splash.png"

# Self Protocol (Optional - Privacy-preserving verification)
NEXT_PUBLIC_SELF_APP_NAME="Zodiac Card"
NEXT_PUBLIC_SELF_SCOPE="zodiac-card-app"
NEXT_PUBLIC_SELF_USE_MOCK="false"
NEXT_PUBLIC_SELF_LOGO_URL="https://your-cdn.com/logo.png"

# Divvi (Referral Tracking)
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS="0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Celo wallet (Metamask, Valora, etc.)

### Installation

1. **Install dependencies**
```bash
pnpm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Run development server**
```bash
pnpm dev
```

4. **Open in browser**
```
http://localhost:3000
```

### Build for Production

```bash
pnpm build
pnpm start
```

## 🔗 Smart Contract Integration

### NFT Contract (V3 - Current)
- **Address**: `0x3ff2E08339588c594E6155Fd088f9668b2E7c775`
- **Type**: UUPS Upgradeable Proxy
- **Functions Used**:
  - `mint(address to, string metadataURI)` - Basic minting
  - `mintFromImagePayment(address to, string metadataURI, uint256 imagePaymentId)` - Mint with payment tracking
  - `nextTokenId()` - Get next token ID
  - `ownerOf(uint256 tokenId)` - Check token ownership
  - `tokenURI(uint256 tokenId)` - Get token metadata

### Payment Contract (V3 - Current)
- **Address**: `0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3`
- **Type**: Standard Contract
- **Functions Used**:
  - `createImagePayment()` - Pay 2.0 CELO for image generation
  - `storeGenerationMetadata(uint256 paymentId, string metadataURI)` - Store fortune metadata on-chain
  - `markAsMinted(uint256 paymentId, uint256 tokenId)` - Mark fortune as minted
  - `getUserCollection(address user)` - Get user's fortunes and NFTs

### Legacy Contracts (V2)
The app maintains backward compatibility with V2 contracts:
- **NFT V2**: `0x415Df58904f56A159748476610B8830db2548158` (Read-only)
- **Payment V2**: `0x52e4212bd4085296168A7f880DfB6B646d52Fe61` (Read-only)

## 🎨 Key Components

### MintButton Component
[`components/mint-button.tsx`](components/mint-button.tsx)

Handles the complete NFT minting flow:
1. Creates NFT metadata JSON
2. Uploads metadata to IPFS via Pinata
3. Calls NFT contract's `mintFromImagePayment()` function
4. Parses NFTMinted event to get token ID
5. Updates payment contract via `markAsMinted()`
6. Integrates Divvi referral tracking

### Collection Page
[`app/collection/page.tsx`](app/collection/page.tsx)

Displays user's complete collection:
- Fetches NFTs from both V3 and V2 contracts
- Shows generated fortunes from both payment contracts
- Supports filtering minted vs generated items
- Implements IPFS gateway fallbacks for reliability

### Fortune Generation Flow
[`app/api/generate-fortune/route.ts`](app/api/generate-fortune/route.ts)

AI-powered fortune generation:
- Uses OpenRouter with GPT-4
- Generates personalized fortunes based on zodiac data
- Supports all zodiac systems (Western, Chinese, Vedic, Mayan)
- Includes celestial alignment integration

### Image Generation
[`app/api/generate-image/route.ts`](app/api/generate-image/route.ts)

Professional fortune card images:
- Uses Replicate Flux Pro model
- Generates high-quality artistic interpretations
- Includes zodiac symbolism and mystical elements
- Uploads to both IPFS and S3 for redundancy

## 🔐 Security Features

### API Key Protection
- ✅ All API keys stored in environment variables
- ✅ No secrets committed to repository
- ✅ Server-side API routes for sensitive operations
- ✅ Environment validation on startup

### Smart Contract Security
- ✅ UUPS upgradeable pattern with access control
- ✅ Reentrancy guards on payment functions
- ✅ Proper event emission for tracking
- ✅ Verified contracts on Celoscan

### Self Protocol Integration
- ✅ Zero-knowledge proof verification
- ✅ No sensitive data stored on-chain
- ✅ Privacy-preserving date of birth checks
- ✅ Optional feature (works without Self)

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Visit [vercel.com](https://vercel.com)
- Import your GitHub repository
- Vercel auto-detects Next.js configuration

3. **Set Environment Variables**
Add all variables from `.env` to Vercel project settings

4. **Deploy**
Vercel automatically deploys on push to main branch

### Environment Variables for Vercel
Make sure to add these in Vercel dashboard:
- All `NEXT_PUBLIC_*` variables
- All API keys (OpenRouter, Replicate, Pinata, AWS)
- Smart contract addresses (both V3 and V2)

## 📱 Farcaster Mini App

### Manifest Configuration
[`public/.well-known/farcaster.json`](public/.well-known/farcaster.json)

Configures the Farcaster Frame:
```json
{
  "accountAssociation": { ... },
  "frame": {
    "name": "Zodiac Cards",
    "version": "1",
    "iconUrl": "...",
    "homeUrl": "https://zodiaccard.xyz",
    "buttonTitle": "Reveal Your Fortune"
  }
}
```

### Frame Endpoint
[`app/api/frame/route.ts`](app/api/frame/route.ts)

Handles Farcaster Frame interactions and button clicks.

## 🧪 Testing

### Run Type Checking
```bash
pnpm type-check
```

### Run Linting
```bash
pnpm lint
```

### Build Test
```bash
pnpm build
```

## 📊 Performance

- ⚡ Next.js 15 with App Router for optimal performance
- 🖼️ Image optimization with Next.js Image component
- 🔄 IPFS gateway fallbacks for reliability
- 📦 Code splitting and lazy loading
- 🎯 Server-side rendering for SEO

## 🐛 Common Issues & Solutions

### IPFS Image Loading
If images don't load, the app automatically tries multiple IPFS gateways:
1. Pinata (primary)
2. Cloudflare IPFS
3. IPFS.io
4. Dweb.link

### Wallet Connection
Ensure you're connected to Celo Mainnet (Chain ID: 42220)

### Transaction Failures
- Check CELO balance (need 2.0 CELO for minting)
- Verify network is Celo Mainnet
- Check console for detailed error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details

## 🔗 Links

- **Live App**: [zodiaccard.xyz](https://zodiaccard.xyz)
- **Main Repository**: [GitHub](https://github.com/JulioMCruz/ZodiacCards)
- **Celo Explorer**: [Celoscan](https://celoscan.io)
- **Farcaster Docs**: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz)

## 💬 Support

- Open an issue on GitHub
- Join our Discord community
- Follow us on Twitter [@ZodiacCardNFT](https://twitter.com/ZodiacCardNFT)

