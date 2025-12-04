#!/bin/bash

# Script to update contract fees using Cast
# Usage: ./update-fees-cast.sh

set -e

echo "🔄 Updating contract fees to 2 CELO using Cast..."
echo ""

# Load environment variables
source .env 2>/dev/null || echo "⚠️  No .env file found, using environment variables"

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set"
    echo "Please set PRIVATE_KEY environment variable"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS" ]; then
    echo "❌ Error: NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_NFT_CONTRACT_ADDRESS" ]; then
    echo "❌ Error: NEXT_PUBLIC_NFT_CONTRACT_ADDRESS not set"
    exit 1
fi

RPC_URL=${CELO_RPC_URL:-"https://forno.celo.org"}
IMAGE_PAYMENT_ADDRESS=$NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS
NFT_ADDRESS=$NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
NEW_FEE="2000000000000000000" # 2 CELO in wei

echo "📍 Configuration:"
echo "   RPC: $RPC_URL"
echo "   Image Payment Contract: $IMAGE_PAYMENT_ADDRESS"
echo "   NFT Contract: $NFT_ADDRESS"
echo "   New Fee: 2 CELO"
echo ""

# Update Image Payment contract fee
echo "📝 Updating Image Payment contract fee..."
CURRENT_IMAGE_FEE=$(cast call $IMAGE_PAYMENT_ADDRESS "imageFee()(uint256)" --rpc-url $RPC_URL)
echo "   Current fee: $(cast --to-unit $CURRENT_IMAGE_FEE ether) CELO"

echo "   Setting new fee to 2 CELO..."
cast send $IMAGE_PAYMENT_ADDRESS \
    "setImageFee(uint256)" \
    $NEW_FEE \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

echo "   ✅ Image fee updated"
NEW_IMAGE_FEE=$(cast call $IMAGE_PAYMENT_ADDRESS "imageFee()(uint256)" --rpc-url $RPC_URL)
echo "   New fee: $(cast --to-unit $NEW_IMAGE_FEE ether) CELO"
echo ""

# Update NFT contract mint fee
echo "📝 Updating NFT contract mint fee..."
CURRENT_MINT_FEE=$(cast call $NFT_ADDRESS "mintFee()(uint256)" --rpc-url $RPC_URL)
echo "   Current fee: $(cast --to-unit $CURRENT_MINT_FEE ether) CELO"

echo "   Setting new fee to 2 CELO..."
cast send $NFT_ADDRESS \
    "setMintFee(uint256)" \
    $NEW_FEE \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

echo "   ✅ Mint fee updated"
NEW_MINT_FEE=$(cast call $NFT_ADDRESS "mintFee()(uint256)" --rpc-url $RPC_URL)
echo "   New fee: $(cast --to-unit $NEW_MINT_FEE ether) CELO"
echo ""

echo "🎉 All fees updated successfully!"
echo ""
echo "📋 Summary:"
echo "   Image Generation: 2 CELO"
echo "   NFT Minting: 2 CELO"
echo "   Total for image → NFT: 4 CELO"
