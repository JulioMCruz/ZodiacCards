#!/bin/bash

# Script to set image generation fee to 1 CELO on Celo Mainnet
# Uses cast from Foundry toolkit

echo "=============================================="
echo "  Setting Image Fee to 1 CELO"
echo "=============================================="

# Load environment variables
source "$(dirname "$0")/../.env"

# Contract address
PAYMENT_CONTRACT="0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3"
RPC_URL="https://forno.celo.org"

# New fee: 1 CELO = 1000000000000000000 wei
NEW_FEE="1000000000000000000"

echo ""
echo "Contract: $PAYMENT_CONTRACT"
echo "New Fee: 1 CELO (1e18 wei)"
echo ""

# Check current fee
echo "Checking current fee..."
CURRENT_FEE=$(cast call $PAYMENT_CONTRACT "imageFee()(uint256)" --rpc-url $RPC_URL)
echo "Current fee: $CURRENT_FEE wei"
echo "Current fee: $(echo "scale=2; $CURRENT_FEE / 1000000000000000000" | bc) CELO"
echo ""

# Check owner
echo "Verifying contract owner..."
OWNER=$(cast call $PAYMENT_CONTRACT "owner()(address)" --rpc-url $RPC_URL)
echo "Contract owner: $OWNER"
echo ""

# Send transaction
echo "Sending transaction to update fee..."
echo "----------------------------------------------"

TX_HASH=$(cast send $PAYMENT_CONTRACT \
  "setImageFee(uint256)" \
  $NEW_FEE \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL \
  --json | jq -r '.transactionHash')

echo "Transaction hash: $TX_HASH"
echo ""

# Wait and verify
echo "Waiting for confirmation..."
sleep 5

# Verify new fee
echo "Verifying updated fee..."
UPDATED_FEE=$(cast call $PAYMENT_CONTRACT "imageFee()(uint256)" --rpc-url $RPC_URL)
echo "Updated fee: $UPDATED_FEE wei"
echo "Updated fee: $(echo "scale=2; $UPDATED_FEE / 1000000000000000000" | bc) CELO"
echo ""

echo "=============================================="
echo "  SUCCESS! Image fee updated to 1 CELO"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Update .env: NEXT_PUBLIC_IMAGE_FEE=1.0"
echo "2. Update README pricing from 2.0 to 1.0 CELO"
echo "3. Redeploy frontend"
