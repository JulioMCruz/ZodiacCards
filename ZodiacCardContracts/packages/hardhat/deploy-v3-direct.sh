#!/bin/bash
set -e

echo "🚀 Deploying ZodiacNFT V3 using Forge..."

# Load environment variables
source ../../.env 2>/dev/null || source ../.env 2>/dev/null || true

DEPLOYER_PK="${OWNER_ADDRESS_PRIVATE_KEY}"
RPC_URL="https://alfajores-forno.celo-testnet.org"
OWNER="${DEPLOYER_ADDRESS:-0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f}"
TREASURY="${TREASURY_ADDRESS:-0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f}"
MINT_FEE="2000000000000000000" # 2 CELO in wei

echo "📝 Configuration:"
echo "- Owner: $OWNER"
echo "- Treasury: $TREASURY"  
echo "- Mint Fee: 2 CELO"
echo ""

# Compile contracts
echo "⏳ Compiling contracts..."
npx hardhat compile

echo "✅ Compilation complete!"
echo ""
echo "⚠️  Manual deployment required due to UUPS proxy complexity"
echo "Please use the hardhat script: npx hardhat run scripts/deploy-zodiac-nft-v3.ts --network celoAlfajores"
