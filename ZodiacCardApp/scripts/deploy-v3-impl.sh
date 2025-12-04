#!/bin/bash

# Deploy new ZodiacImagePayment V3 implementation

set -e

source .env

PROXY_ADDRESS="0x52e4212bd4085296168A7f880DfB6B646d52Fe61"
RPC_URL="${CELO_RPC_URL:-https://forno.celo.org}"

echo "🚀 Deploying new ZodiacImagePayment_V3 implementation..."

# Use solc directly to compile just the V3 contract
cd contracts

# Compile with solc
echo "📦 Compiling ZodiacImagePayment_V3.sol..."
solc --optimize --optimize-runs 200 \
  --via-ir \
  --bin --abi \
  @openzeppelin/=$(pwd)/../node_modules/@openzeppelin/ \
  ZodiacImagePayment_V3.sol \
  -o ../build/V3 --overwrite

if [ ! -f "../build/V3/ZodiacImagePayment_V3.bin" ]; then
  echo "❌ Compilation failed!"
  exit 1
fi

echo "✅ Compilation successful"

cd ..

# Deploy using cast
echo "🚀 Deploying contract..."
BYTECODE="0x$(cat build/V3/ZodiacImagePayment_V3.bin)"

# Deploy the contract
DEPLOY_TX=$(cast send \
  --create $BYTECODE \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --json)

NEW_IMPL=$(echo $DEPLOY_TX | jq -r '.contractAddress')

echo "✅ New implementation deployed at: $NEW_IMPL"

# Upgrade proxy
echo "⬆️  Upgrading proxy..."
cast send $PROXY_ADDRESS \
  "upgradeTo(address)" \
  $NEW_IMPL \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

echo "✅ Upgrade complete!"

# Verify
CURRENT=$(cast implementation $PROXY_ADDRESS --rpc-url $RPC_URL)
echo "Current implementation: $CURRENT"

if [ "$CURRENT" = "$NEW_IMPL" ]; then
  echo "✅ Upgrade verified!"
else
  echo "❌ Verification failed!"
  exit 1
fi
