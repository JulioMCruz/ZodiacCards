# Zodiac Card - Project Documentation for Claude Code

> AI-powered NFT fortune-telling dApp on Celo blockchain with Farcaster integration

## Project Overview

**Zodiac Card** is a Farcaster Mini App that generates personalized astrological fortunes as NFTs on Celo Mainnet. The project combines astrology, AI image generation, blockchain technology, and privacy-preserving identity verification to create unique, mintable fortune cards.

**Key Characteristics**:
- **Category**: Web3 dApp, NFT Platform, Social Mini App
- **Blockchain**: Celo Mainnet (Chain ID: 42220), carbon-negative, mobile-first
- **Social Platform**: Farcaster Mini App with Frames integration
- **AI Integration**: OpenAI GPT-4, Replicate Flux Pro
- **Privacy**: Self Protocol (zero-knowledge proofs)
- **Pricing**: 2.0 CELO per fortune + 2.0 CELO per mint

## Architecture

### Tech Stack
```yaml
Frontend:
  framework: Next.js 15 (App Router)
  ui_library: React 19
  styling: [Tailwind CSS, Shadcn UI, Radix UI]
  animations: Framer Motion

Blockchain:
  network: Celo Mainnet (42220)
  contracts: Solidity ^0.8.20
  tools: [Hardhat, OpenZeppelin]
  web3: [Wagmi v2, Viem v2]
  pattern: UUPS Upgradeable Proxy

Backend:
  runtime: Next.js API Routes (Edge)
  ai_models: [OpenAI GPT-4, Replicate Flux Pro]
  storage: [IPFS/Pinata, AWS S3]

Authentication:
  primary: Farcaster Frame SDK
  wallet: WalletConnect v2
  privacy: Self Protocol (ZK Proofs)

Testing:
  contracts: Hardhat + OpenZeppelin Test Helpers
  coverage: Unit + Integration tests
```

### Core Components

**Smart Contracts** (V3 - Current):
- **NFT Contract**: `0x3ff2E08339588c594E6155Fd088f9668b2E7c775` (UUPS Proxy)
- **Payment Contract**: `0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3`
- **Features**: ERC721, ERC2981 royalties (2.5%), dual mint functions
- **Implementation**: `0x3b433190AD6dB27461f6a118AcfcDFfa0E1D491b`

**Frontend Routes**:
- `/` - Landing page with zodiac system carousel
- `/fortune` - Fortune generation form with Self Protocol integration
- `/result/[id]` - Generated fortune display
- `/mint` - NFT minting interface
- `/collection` - User's NFT collection (V2 + V3 backward compatible)
- `/frame` - Farcaster Frame endpoint

**API Endpoints** (14 routes):
- `/api/generate-fortune` - AI fortune generation
- `/api/generate-image` - Replicate Flux Pro image generation
- `/api/upload-to-ipfs` - IPFS metadata upload via Pinata
- `/api/upload-to-s3` - AWS S3 image storage
- `/api/verify-self` - Self Protocol ZK verification
- `/api/payment/verify` - Payment verification
- `/api/fetch-nft-metadata` - NFT metadata retrieval
- `/api/frame` - Farcaster Frame logic

### Contract Evolution

| Version | Status | NFT Contract | Payment Contract | Mint Fee | Notes |
|---------|--------|--------------|------------------|----------|-------|
| **V3** | ✅ Active | `0x3ff2...c775` | `0x2e73...51f3` | 2.0 CELO | Clean state, dual functions |
| **V2** | 🔒 Legacy | `0x415D...8158` | `0x52e4...e61` | 10.0 CELO | Read-only, corrupted state |
| **V1** | 🔒 Historical | TBD | - | TBD | Original implementation |

**Backward Compatibility**: Frontend displays all NFT versions in collection view.

## Project Structure

```
ZodiacCards/
├── ZodiacCardApp/              # Main Next.js application
│   ├── app/
│   │   ├── api/               # 14 API route handlers
│   │   ├── fortune/          # Fortune generation flow
│   │   ├── result/           # Fortune display pages
│   │   ├── mint/             # NFT minting interface
│   │   ├── collection/       # NFT gallery (V2+V3)
│   │   ├── frame/            # Farcaster Frame endpoint
│   │   ├── page.tsx          # Landing page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── seasonal-theme-selector.tsx # Theme selection UI
│   │   ├── western-zodiac-form.tsx    # Western zodiac form
│   │   ├── chinese-zodiac-form.tsx    # Chinese zodiac form
│   │   ├── vedic-zodiac-form.tsx      # Vedic zodiac form
│   │   ├── mayan-zodiac-form.tsx      # Mayan zodiac form
│   │   ├── image-payment-button.tsx   # Payment button
│   │   ├── self-verify-button.tsx     # Self Protocol verification
│   │   └── ui/               # Shadcn UI components
│   ├── lib/
│   │   ├── abis.ts           # Contract ABIs (20KB)
│   │   ├── constants.ts      # Contract addresses + config
│   │   ├── wagmi.ts          # Wagmi configuration
│   │   ├── zodiac-utils.ts   # Astrological calculations
│   │   ├── seasonal-themes.ts # Theme constants & utilities
│   │   ├── divvi.ts          # Referral tracking
│   │   └── db/               # Database utilities
│   ├── providers/
│   │   └── wagmi-provider.tsx # Web3 provider wrapper
│   ├── contracts/            # Solidity source files
│   │   ├── ZodiacImagePayment_V3.sol
│   │   ├── ZodiacImagePayment.sol (V2)
│   │   └── ZodiacNFT_V2.sol
│   ├── scripts/              # Deployment scripts
│   ├── hardhat.config.ts     # Hardhat configuration
│   └── package.json          # Dependencies
├── docs/                     # Technical documentation (18 files)
│   ├── MILESTONE_UPDATE.md   # V3 deployment details
│   ├── DEPLOYMENT_GUIDE.md   # Contract deployment
│   ├── PAYMENT_SYSTEM_V2.md  # Payment architecture
│   └── SELF_PROTOCOL_INTEGRATION.md
└── README.md                 # User-facing documentation
```

## Development Workflows

### Smart Contract Development

**Environment Setup**:
```bash
cd ZodiacCardApp
yarn install
```

**Key Commands**:
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Celo Alfajores
npx hardhat run scripts/deploy-zodiac-nft-v3.ts --network celoAlfajores

# Deploy to Celo Mainnet
npx hardhat run scripts/deploy-zodiac-nft-v3.ts --network celo

# Verify on Celoscan
npx hardhat verify --network celo <CONTRACT_ADDRESS>
```

**Contract Testing**:
- Unit tests for all contract functions
- Gas optimization tests
- Upgrade simulation tests
- Payment flow integration tests

### Frontend Development

**Start Dev Server**:
```bash
cd ZodiacCardApp
pnpm dev
```

**Environment Variables** (`.env.local`):
```bash
# Network
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org

# V3 Contracts (Active)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x3ff2E08339588c594E6155Fd088f9668b2E7c775
NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS=0x3ff2E08339588c594E6155Fd088f9668b2E7c775
NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS=0x3b433190AD6dB27461f6a118AcfcDFfa0E1D491b
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS=0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3

# V2 Contracts (Legacy)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_V2=0x415Df58904f56A159748476610B8830db2548158
NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS_V2=0x52e4212bd4085296168A7f880DfB6B646d52Fe61

# Pricing
NEXT_PUBLIC_CELO_MINT_PRICE=2.0
NEXT_PUBLIC_IMAGE_FEE=2.0

# External Services
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
OPENAI_API_KEY=<your-openai-key>
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_API_KEY=<your-pinata-secret>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=<your-bucket>

# Self Protocol (Optional)
NEXT_PUBLIC_SELF_APP_NAME=Zodiac Card
NEXT_PUBLIC_SELF_SCOPE=zodiac-card-app
NEXT_PUBLIC_SITE_URL=<your-site-url>

# Divvi Referral (Optional)
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS=<your-divvi-address>
```

**Key Development Areas**:
- Fortune generation UI (`app/fortune/`)
- NFT minting flow (`app/mint/`)
- Collection display (`app/collection/`)
- API route handlers (`app/api/`)
- Contract interactions (`lib/abis.ts`, `lib/constants.ts`)

## User Flow

### Complete Journey (V3)
```
1. Authentication
   User → Farcaster App → Zodiac Card UI

2. Data Collection (Optional Self Protocol)
   User → Scan QR → Self App → ZK Proof → Auto-fill DOB
   OR Manual Entry

3. Theme Selection
   User → Select theme: Classic/Winter Holidays/New Year
   → Theme availability validated by date
   → Theme parameter added to generation request

4. Fortune Generation (2.0 CELO)
   User → Payment Contract → createImagePayment(2.0 CELO)
   → API → buildSeasonalPrompt(basePrompt, theme)
   → Replicate Flux Pro (with seasonal modifiers)
   → AWS S3 → IPFS (with theme metadata)
   → Payment Contract → storeGenerationMetadata()

5. NFT Minting (2.0 CELO)
   User → NFT Contract → mintFromImagePayment(2.0 CELO)
   → Auto-increment tokenId → Link IPFS metadata (with theme)
   → Divvi referral tracking → Emit NFTMinted event
   → Payment Contract → markAsMinted()

6. Collection View
   User → Blockscout API → Fetch V3 + V2 NFTs
   → IPFS → Fetch metadata → Display gallery
```

## Key Features & Integrations

### Self Protocol Integration
**Purpose**: Privacy-preserving date of birth verification
- Zero-knowledge proof verification
- Auto-fill birth information from Self app
- No sensitive data stored on-chain
- SDK: `@selfxyz/core` (backend), `@selfxyz/qrcode` (frontend)

### Divvi Referral System
**Purpose**: Track NFT mint referrals
- SDK: `@divvi/referral-sdk`
- Integration point: `mintFromImagePayment()` function
- Consumer address tracked in contract events

### Farcaster Frames
**Purpose**: Social sharing within Farcaster feed
- Frame endpoint: `/api/frame`
- Displays fortune card previews
- Direct minting from Frame UI
- SDK: `@farcaster/miniapp-sdk`

### AI Image Generation
**Service**: Replicate Flux Pro
- Model: High-quality AI image generation
- Input: Zodiac sign + birth data + fortune text + seasonal theme modifiers
- Output: 1024x1024 PNG images
- Storage: AWS S3 → IPFS metadata

### Seasonal Theme System
**Purpose**: Holiday-themed fortune card generation
- **Theme Options**:
  - **Classic Zodiac** (⭐): Traditional cosmic and anime style (always available)
  - **Winter Holidays** (🎄): Festive December theme with snow & lights (December only)
  - **New Year** (🎆): Celebration theme with fireworks & sparkles (Dec 25 - Jan 7)
- **Implementation**: Client-side prompt modifiers appended to base image generation prompt
- **Availability**: Time-based theme activation using `isThemeAvailable()` function
- **Metadata**: Theme selection stored in IPFS metadata for each NFT
- **User Experience**: Theme selector UI component in all 4 zodiac forms
- **Files**:
  - `lib/seasonal-themes.ts` - Theme constants, utilities, and prompt builder
  - `components/seasonal-theme-selector.tsx` - Reusable theme selector UI
  - All zodiac forms include theme selection before payment

#### End-to-End Seasonal Theme Flow (Verified)

The complete flow from theme selection to NFT metadata storage:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     SEASONAL THEME END-TO-END FLOW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STEP 1: Theme Selection (Zodiac Forms)                                         │
│  ─────────────────────────────────────────                                      │
│  File: components/[western|chinese|vedic|mayan]-zodiac-form.tsx                 │
│  • User sees SeasonalThemeSelector component                                    │
│  • getDefaultTheme() returns first available theme                              │
│  • Winter Holidays auto-selected in December (first available)                  │
│  • Theme stored in selectedTheme state                                          │
│  • Validation: isThemeAvailable() checks current date                           │
│                                                                                 │
│                              ↓                                                  │
│                                                                                 │
│  STEP 2: Payment & Navigation                                                   │
│  ───────────────────────────────                                                │
│  File: components/[zodiac]-form.tsx (handleSubmit)                              │
│  • User pays 2.0 CELO via Payment Contract                                      │
│  • Theme passed to result page via URL parameter:                               │
│    /result?theme=winter-holidays&sign=Aries&zodiacType=western                  │
│  • URLSearchParams preserves theme selection across navigation                  │
│                                                                                 │
│                              ↓                                                  │
│                                                                                 │
│  STEP 3: Prompt Building (Result Page)                                          │
│  ─────────────────────────────────────                                          │
│  File: app/result/page.tsx                                                      │
│  • selectedTheme extracted from URL: searchParams.get("theme")                  │
│  • Base prompt constructed with zodiac character details                        │
│  • buildSeasonalPrompt(basePrompt, selectedTheme) called                        │
│  • Theme modifiers injected into cosmic backdrop section:                       │
│    - Winter Holidays: Snowflakes, aurora lights, golden bokeh, frost           │
│    - New Year: Fireworks, confetti, midnight blue & gold tones                 │
│                                                                                 │
│                              ↓                                                  │
│                                                                                 │
│  STEP 4: AI Image Generation                                                    │
│  ───────────────────────────                                                    │
│  File: app/api/generate-image/route.ts                                          │
│  • Themed prompt sent to Replicate Flux Pro                                     │
│  • AI generates image with seasonal visual elements                             │
│  • Image uploaded to AWS S3 for storage                                         │
│  • Returns imageUrl for metadata creation                                       │
│                                                                                 │
│                              ↓                                                  │
│                                                                                 │
│  STEP 5: IPFS Metadata Storage                                                  │
│  ────────────────────────────                                                   │
│  File: app/api/upload-generation-metadata/route.ts                              │
│  • Theme info included in metadata JSON:                                        │
│    {                                                                            │
│      theme: "winter-holidays",                                                  │
│      themeInfo: {                                                               │
│        id: "winter-holidays",                                                   │
│        name: "Winter Holidays",                                                 │
│        description: "Festive December theme with snow & lights",               │
│        emoji: "🎄"                                                              │
│      },                                                                         │
│      fortuneText: "...",                                                        │
│      imageUrl: "...",                                                           │
│      generatedAt: "2024-12-16T..."                                              │
│    }                                                                            │
│  • Metadata pinned to IPFS via Pinata                                           │
│  • Returns ipfsUri for NFT minting                                              │
│                                                                                 │
│                              ↓                                                  │
│                                                                                 │
│  STEP 6: NFT Minting & Collection                                               │
│  ──────────────────────────────                                                 │
│  • User mints NFT with themed metadata URI                                      │
│  • Theme permanently stored in NFT's IPFS metadata                              │
│  • Collection view can filter/display by theme                                  │
│  • Historical record of limited-time seasonal NFTs preserved                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Validation Checkpoints**:

| Step | Component | Validation | Status |
|------|-----------|------------|--------|
| 1 | Theme Selection | `isThemeAvailable('winter-holidays')` returns `true` in December | ✅ Verified |
| 2 | URL Parameter | Theme persists through navigation via `?theme=winter-holidays` | ✅ Verified |
| 3 | Prompt Building | `buildSeasonalPrompt()` injects theme modifiers into base prompt | ✅ Verified |
| 4 | Image Generation | Replicate receives themed prompt with seasonal elements | ✅ Verified |
| 5 | IPFS Storage | Metadata JSON includes `theme` and `themeInfo` fields | ✅ Verified |
| 6 | NFT Record | Theme info permanently stored in NFT metadata | ✅ Verified |

**Business Benefits**:
- **Limited-Time Collectibles**: Winter Holidays NFTs only mintable in December
- **Seasonal Exclusivity**: Creates urgency and collector value
- **Historical Record**: Theme info in IPFS enables future filtering/display
- **User Engagement**: Festive themes encourage holiday participation

### IPFS Storage
**Provider**: Pinata
- Metadata storage for NFTs
- Generation metadata (fortune + image)
- Gas-free metadata updates
- Immutable content addressing

## Security Considerations

**Status**: ✅ Security audit passed ([SECURITY_AUDIT.md](SECURITY_AUDIT.md))

**Security Measures**:
- No exposed secrets in codebase
- All sensitive data in `.env` (gitignored)
- Proper environment variable usage
- ReentrancyGuard on payment functions
- Pausable contracts for emergency stops
- Ownable access control
- UUPS upgradeability for bug fixes

**Contract Security**:
- OpenZeppelin base contracts
- Upgradeable via UUPS pattern
- 200 optimization runs
- Verified on Celoscan
- Unit + integration tests

## Common Development Tasks

### Adding a New Zodiac System
1. Update `lib/zodiac-data.ts` with system data
2. Add calculation logic to `lib/zodiac-utils.ts`
3. Update fortune prompt in `app/api/generate-fortune/route.ts`
4. Add UI card to `app/page.tsx` carousel

### Adding or Modifying Seasonal Themes
1. Edit theme constants in `lib/seasonal-themes.ts`
2. Add new theme to `SEASONAL_THEMES` array with:
   - `id`: Unique theme identifier
   - `name`: Display name
   - `description`: User-facing description
   - `emoji`: Theme icon
   - `promptModifiers`: Detailed prompt additions for AI image generation
   - `color`: Tailwind color for UI theming
3. Update `isThemeAvailable()` function with date logic for new theme
4. Theme selector UI automatically updates with new themes
5. Test theme modifiers with image generation
6. All zodiac forms automatically include new theme option

### Modifying Contract Logic
1. Edit contract in `contracts/`
2. Update ABI in `lib/abis.ts`
3. Run `npx hardhat compile`
4. Update tests in `test/`
5. Deploy new implementation
6. Upgrade proxy (if UUPS)

### Adding New API Endpoint
1. Create route in `app/api/[endpoint]/route.ts`
2. Use `NextRequest`, `NextResponse` types
3. Add error handling and validation
4. Update frontend to call new endpoint

### Debugging Contract Interactions
- Check Celoscan for transaction details
- Use `cast` CLI for contract calls
- Verify contract state with read functions
- Check event logs for minting/payment events

## Testing Strategy

**Contract Tests**:
```bash
npx hardhat test
```
- Payment flow tests
- Minting logic tests
- Access control tests
- Upgrade functionality tests

**Frontend Testing**:
- Manual testing on Alfajores testnet
- Production verification on Celo Mainnet
- Farcaster Frame validation
- Wallet connection testing

## Deployment

**Prerequisites**:
- Funded Celo wallet with CELO for gas
- Celoscan API key for verification
- RPC URL (Forno for mainnet/testnet)

**Deployment Process**:
1. Update contract in `contracts/`
2. Update deployment script in `scripts/`
3. Set environment variables
4. Deploy: `npx hardhat run scripts/deploy-zodiac-nft-v3.ts --network celo`
5. Verify: `npx hardhat verify --network celo <ADDRESS>`
6. Update frontend constants in `lib/constants.ts`
7. Test on frontend

**Vercel Deployment** (Frontend):
- Connected to GitHub repository
- Auto-deploy on push to `main` branch
- Environment variables in Vercel dashboard
- Custom domain: zodiaccard.xyz

## Important Notes for Claude

### When Working on Contracts
- Always use UUPS upgradeable pattern
- Include ReentrancyGuard on payable functions
- Emit events for all state changes
- Test thoroughly before mainnet deployment
- Update ABIs in `lib/abis.ts` after compilation

### When Working on Frontend
- Use Wagmi v2 hooks for contract interactions
- Parse CELO amounts with 18 decimals (not 6!)
- Handle both V2 and V3 contract addresses
- Maintain backward compatibility for NFT collection
- Test with Farcaster Frame validator

### When Working on API Routes
- Use Edge runtime for performance
- Validate all user inputs
- Handle errors gracefully
- Return proper HTTP status codes
- Log important events for debugging

### When Working on Seasonal Themes
- Theme modifiers are client-side only (no contract changes)
- All themes use same 2.0 CELO pricing
- Use `buildSeasonalPrompt()` to inject theme modifiers into base prompt
- Theme modifiers insert before final "balance" statement in prompt
- Validate theme availability with `isThemeAvailable()` before activation
- Theme info stored in IPFS metadata for historical record
- SeasonalThemeSelector component is reusable across all forms
- Test themes during their availability periods for accurate results

### Cost Considerations
- Image generation: ~$0.30 per fortune (Replicate)
- IPFS storage: ~$0.01 per upload (Pinata)
- Gas costs: ~0.001 CELO per transaction
- User pays: 2.0 CELO per fortune + 2.0 CELO per mint

### Performance Targets
- Fortune generation: <30s
- Image generation: <15s
- NFT minting: <5s
- Collection loading: <3s

## Resources

**Documentation**:
- [README.md](README.md) - User-facing documentation
- [docs/MILESTONE_UPDATE.md](docs/MILESTONE_UPDATE.md) - V3 deployment details
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Contract deployment
- [docs/PAYMENT_SYSTEM_V2.md](docs/PAYMENT_SYSTEM_V2.md) - Payment architecture
- [docs/SELF_PROTOCOL_INTEGRATION.md](docs/SELF_PROTOCOL_INTEGRATION.md) - Privacy features

**External Links**:
- Celo Docs: https://docs.celo.org
- Farcaster Mini Apps: https://miniapps.farcaster.xyz
- Self Protocol: https://selfxyz.com/docs
- Divvi SDK: https://docs.divvi.xyz
- Wagmi: https://wagmi.sh
- Hardhat: https://hardhat.org

**Blockchain Explorers**:
- Celoscan Mainnet: https://celoscan.io
- Celoscan Alfajores: https://alfajores.celoscan.io

**Contract Addresses**:
- V3 NFT: https://celoscan.io/address/0x3ff2E08339588c594E6155Fd088f9668b2E7c775
- V3 Payment: https://celoscan.io/address/0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3

## Project History

- **October 23, 2025**: Project launch, V1 framework
- **October 2025**: V1 deployment, basic minting
- **November 2025**: V2 deployment, payment system upgrade
- **December 3, 2025**: V3 deployment, clean state, reduced pricing
- **Current**: Active development, 2.0 CELO pricing, Self Protocol integration

## Troubleshooting

**Common Issues**:

1. **"Transaction reverted"**
   - Check CELO balance (need >2.0 CELO + gas)
   - Verify contract addresses in `lib/constants.ts`
   - Check network (should be Celo Mainnet 42220)

2. **"Failed to fetch NFTs"**
   - Verify Blockscout API is accessible
   - Check contract addresses (V2 + V3)
   - Ensure metadata uploaded to IPFS

3. **"Image generation timeout"**
   - Replicate API may be slow (wait up to 60s)
   - Check API key validity
   - Verify S3 bucket permissions

4. **"Self Protocol verification failed"**
   - Ensure Self app is installed
   - Check QR code generation
   - Verify backend API route

## Development Philosophy

**Priorities**:
1. **User Experience**: Fast, intuitive, mobile-friendly
2. **Security**: Audited contracts, no exposed secrets
3. **Privacy**: Self Protocol for sensitive data
4. **Cost Efficiency**: Low Celo gas fees, reduced mint price
5. **Backward Compatibility**: Support legacy NFTs
6. **Social Integration**: Native Farcaster experience

**Code Standards**:
- TypeScript for type safety
- ESLint + Prettier for code quality
- Comprehensive error handling
- Clear variable naming
- Inline documentation for complex logic
- Git workflow: feature branches → main

## Future Enhancements

**Roadmap**:
- [ ] Advanced astrological calculations
- [ ] Multi-language support
- [ ] NFT marketplace integration
- [ ] Community fortune sharing
- [ ] Astrological insights dashboard
- [ ] Mobile app (React Native)
- [ ] Additional zodiac systems (Japanese, etc.)
