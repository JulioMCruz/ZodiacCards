#!/bin/bash

# Upgrade ZodiacImagePayment V3 to allow owner to call storeGeneration

set -e

# Load environment variables
source .env

PROXY_ADDRESS="0x52e4212bd4085296168A7f880DfB6B646d52Fe61"
RPC_URL="${CELO_RPC_URL:-https://forno.celo.org}"

echo "🔄 Upgrading ZodiacImagePayment V3 contract..."
echo "Proxy: $PROXY_ADDRESS"

# Compile the contract
echo "📦 Compiling contract..."
forge build --silent

# Get the implementation address before upgrade
echo "📍 Current implementation:"
cast implementation $PROXY_ADDRESS --rpc-url $RPC_URL

# Deploy new implementation
echo "🚀 Deploying new implementation..."
NEW_IMPL=$(forge create \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy \
    contracts/ZodiacImagePayment_V3.sol:ZodiacImagePayment_V3 \
    --json | jq -r '.deployedTo')

echo "✅ New implementation deployed: $NEW_IMPL"

# Upgrade the proxy to new implementation
echo "⬆️  Upgrading proxy to new implementation..."
cast send $PROXY_ADDRESS \
    "upgradeTo(address)" \
    $NEW_IMPL \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

echo "✅ Upgrade complete!"

# Verify the upgrade
echo "🔍 Verifying upgrade..."
CURRENT_IMPL=$(cast implementation $PROXY_ADDRESS --rpc-url $RPC_URL)
echo "Current implementation: $CURRENT_IMPL"

if [ "$CURRENT_IMPL" = "$NEW_IMPL" ]; then
    echo "✅ Upgrade verified successfully!"
else
    echo "❌ Upgrade verification failed!"
    exit 1
fi
