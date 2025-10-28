# 🔮 Zodiac Card - Personalized NFT Fortunes on Celo

> A Farcaster Mini App that generates personalized Zodiac fortunes and mints them as NFTs on Celo Mainnet.

<div align="center">
  <img src="ZodiacCardApp/public/Marketing.png" alt="Zodiac Card Banner" style="max-width: 300px; width: 100%;"/>
</div>

## 🌐 Live Deployment

**Network**: Celo Mainnet (Chain ID: 42220)

**Deployed Contract**: `0x415Df58904f56A159748476610B8830db2548158`
- [View on Celoscan](https://celoscan.io/address/0x415Df58904f56A159748476610B8830db2548158)
- ✅ **Verified Contract** - Source code publicly available
- Mint Fee: **10.0 CELO** (native token payment)
- Royalty: 2.5% (ERC2981)
- Proxy Type: UUPS Upgradeable
- Compiler: Solidity v0.8.20 with 200 optimization runs

## Overview

Zodiac Card is a Farcaster Frame-enabled Mini App deployed on Celo blockchain, designed to revolutionize fortune-telling in the web3 space. Built natively for the Farcaster ecosystem, it leverages Frames for seamless social interactions and Celo's mobile-first blockchain infrastructure for accessible, low-cost transactions using native CELO tokens. The app enables Farcaster users to engage with fortune-telling experiences directly within their social feeds, fostering a unique blend of social engagement and web3 functionality.

As a decentralized application, Zodiac Card combines the power of astrology, NFTs, and AI to create personalized fortune-telling experiences. Users can mint unique NFTs that represent their personalized fortune cards, with each card dynamically generated based on three key elements:
- Their zodiac sign and astrological profile
- Precise birth date and time data
- Real-time celestial alignments and astronomical positions

The integration with Farcaster's social protocol allows users to share their fortune cards, participate in astrological discussions, and build a community around shared cosmic experiences. Through Celo blockchain's mobile-first infrastructure and native CELO payments (18 decimals), users enjoy fast minting processes and minimal transaction costs while maintaining the security and decentralization benefits of a carbon-negative blockchain.

## Features

- 🎴 Mint unique Zodiac Fortune NFTs for **10.0 CELO**
- 🔮 AI-powered fortune predictions using OpenAI GPT-4
- 🔐 **Self Protocol Integration** - Privacy-preserving identity verification
  - Zero-knowledge proof verification for date of birth
  - Auto-fill birth information securely from Self app
  - No sensitive data stored on-chain
- ⭐ Multiple Zodiac Systems:
  - Chinese Zodiac (12 animals based on birth year)
  - Western Zodiac (12 signs based on birth date)
  - Vedic Astrology (Nakshatra system)
  - Mayan Calendar (Tzolkin day signs)
- 🌌 Real-time celestial alignment integration
- 💫 Interactive card viewing experience
- 🔄 Secondary market trading capabilities
- 🖼️ Farcaster Frames integration for social sharing
- 🌐 Native Celo blockchain deployment (carbon-negative)
- 💰 Pay with native CELO tokens - **10.0 CELO** per mint
- 📱 Optimized for Farcaster Mini App experience

## 🔒 Security

**Status**: ✅ Security Audit Passed

All API keys and private keys are properly protected:
- ✅ No exposed secrets in codebase
- ✅ All sensitive data in `.env` files (gitignored)
- ✅ Proper environment variable usage throughout
- ✅ Zero hardcoded credentials

📄 See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for full audit report.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Blockchain**: Solidity ^0.8.20, Hardhat, Celo Network
- **Web3**: Viem v2, Wagmi v2
- **AI/ML**: OpenAI GPT-4
- **Privacy**: Self Protocol (Zero-Knowledge Proofs)
  - @selfxyz/core - Backend verification
  - @selfxyz/qrcode - Frontend SDK
- **Storage**: IPFS (Pinata), AWS S3
- **Authentication**: Farcaster Frame SDK, Wallet Connect
- **Testing**: Hardhat Test, OpenZeppelin Test Helpers
- **Farcaster**: Frames SDK v0.0.34

## Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        WC[Wallet Connection]
        AI[AI Integration]
    end

    subgraph Backend
        API[Next.js API Routes]
        Auth[Authentication]
        Cache[Redis Cache]
    end

    subgraph Blockchain
        SC[Smart Contracts]
        IPFS[IPFS Storage]
        Events[Event Listeners]
    end

    UI --> WC
    UI --> AI
    WC --> API
    AI --> API
    API --> Auth
    API --> Cache
    API --> SC
    SC --> IPFS
    SC --> Events
    Events --> API
```

## Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant AI as AI Service
    participant BC as Blockchain
    participant IPFS as IPFS Storage

    User->>UI: Connect Wallet
    UI->>API: Authenticate
    API-->>UI: Session Token

    User->>UI: Enter Birth Details
    UI->>AI: Generate Fortune
    AI-->>UI: Fortune Prediction

    User->>UI: Mint NFT
    UI->>API: Prepare Metadata
    API->>IPFS: Store Metadata
    IPFS-->>API: IPFS Hash
    API->>BC: Mint NFT
    BC-->>UI: NFT Minted
    UI-->>User: Display NFT

    User->>UI: View Fortune
    UI->>BC: Fetch NFT Data
    BC-->>UI: Token URI
    UI->>IPFS: Fetch Metadata
    IPFS-->>UI: Card Details
    UI-->>User: Display Card
```

## Project Structure

```
zodiac-card/
├── ZodiacCardApp/         # Next.js 15 application
│   ├── app/              # App directory
│   │   ├── api/         # API routes (fortune, image, IPFS, S3)
│   │   ├── components/  # React components
│   │   ├── fortune/     # Fortune generation pages
│   │   └── result/      # NFT result display
│   ├── lib/             # Utility functions
│   ├── providers/       # Wagmi providers
│   └── public/          # Static assets
└── ZodiacCardContracts/ # Smart contract monorepo
    └── packages/
        └── hardhat/      # Hardhat development environment
            ├── contracts/     # Smart contract source files (ZodiacNFT.sol)
            ├── deploy/        # Deployment scripts
            ├── test/          # Contract test files
            └── hardhat.config.ts  # Celo network configuration
```

## Smart Contracts

The smart contracts for Zodiac Card are organized in a monorepo structure under `ZodiacCardContracts/`. This setup allows for better organization and separation of concerns between the frontend application and blockchain components.

### Contract Architecture

The smart contracts are developed using Hardhat and deployed on Celo network:

- **ZodiacNFT.sol**: ERC721 upgradeable NFT contract with ERC2981 royalties (2.5%)
- **Payment**: Native CELO tokens (18 decimals) via payable minting
- **Storage**: IPFS integration for metadata storage
- **Upgradeability**: UUPS proxy pattern for future enhancements
- **Events**: NFTMinted, MintFeeUpdated, TreasuryAddressUpdated
- **Access Control**: Ownable pattern for admin functions

### Development Environment

The contracts are set up with a robust development environment including:

- Hardhat for development, testing, and deployment
- TypeScript support for type-safe development
- Automated testing setup
- Deployment scripts for multiple networks
- Environment variable configuration
- Code quality tools (ESLint, Prettier)

### Getting Started with Contracts

1. Navigate to the contracts directory
```bash
cd ZodiacCardContracts/packages/hardhat
```

2. Install dependencies
```bash
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Compile contracts
```bash
yarn compile
```

5. Run tests
```bash
yarn test
```

6. Deploy to Celo networks
```bash
# Deploy to Celo Alfajores testnet
yarn deploy --network celoAlfajores

# Deploy to Celo mainnet
yarn deploy --network celo

# Verify contract on Celoscan
yarn hardhat verify --network celo <CONTRACT_ADDRESS>
```

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/zodiac-card.git
cd zodiac-card
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cd ZodiacCardApp
cp .env.example .env.local

# Required environment variables:
# NEXT_PUBLIC_CHAIN_ID=42220 (Celo Mainnet)
# NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x415Df58904f56A159748476610B8830db2548158
# NEXT_PUBLIC_CELO_MINT_PRICE=5.0
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
# NEXT_PUBLIC_RPC_URL_CELO=https://forno.celo.org
# OPENAI_API_KEY=<your-openai-key>
# PINATA_API_KEY=<your-pinata-key>
# AWS_ACCESS_KEY_ID=<your-aws-key>
#
# Self Protocol (Optional - for privacy-preserving birth date verification):
# NEXT_PUBLIC_SELF_APP_NAME=Zodiac Card
# NEXT_PUBLIC_SELF_SCOPE=zodiac-card-app
# NEXT_PUBLIC_SITE_URL=<your-site-url>
```

4. Run the development server
```bash
cd ZodiacCardApp
pnpm dev
```

5. Smart contracts are already deployed
- Mainnet contract: `0x415Df58904f56A159748476610B8830db2548158`
- See [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md) for details

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [zodiaccard.xyz](https://zodiaccard.xyz)
- Twitter: [@ZodiacCardNFT](https://twitter.com/ZodiacCardNFT)
- Discord: [Join our community](https://discord.gg/zodiaccard)
- Farcaster Mini App Documentation: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/)
