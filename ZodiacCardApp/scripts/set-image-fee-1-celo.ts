import { ethers } from "hardhat"

/**
 * Script to update image generation fee to 1 CELO
 * Target: ZodiacImagePayment_V3 contract on Celo Mainnet
 *
 * Run with: npx hardhat run scripts/set-image-fee-1-celo.ts --network celo
 */
async function main() {
  console.log("=".repeat(60))
  console.log("  Setting Image Generation Fee to 1 CELO")
  console.log("=".repeat(60))

  const [deployer] = await ethers.getSigners()
  console.log("\n Account:", deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(" Balance:", ethers.formatEther(balance), "CELO")

  // Payment Contract V3 address
  const PAYMENT_CONTRACT = "0x2e73081c0455a43f99a02d38a6c6a90b4d3b51f3"
  const NEW_FEE = ethers.parseEther("1.0") // 1 CELO

  console.log("\n Contract:", PAYMENT_CONTRACT)
  console.log(" New Fee: 1.0 CELO")
  console.log("-".repeat(60))

  try {
    // Connect to the Payment Contract
    const paymentContract = await ethers.getContractAt(
      "ZodiacImagePayment_V3",
      PAYMENT_CONTRACT
    )

    // Check current fee
    const currentFee = await paymentContract.imageFee()
    console.log("\n Current Image Fee:", ethers.formatEther(currentFee), "CELO")

    if (currentFee === NEW_FEE) {
      console.log("\n Fee is already set to 1 CELO. No action needed.")
      return
    }

    // Update the fee
    console.log("\n Sending transaction to update fee...")
    const tx = await paymentContract.setImageFee(NEW_FEE)
    console.log(" Transaction hash:", tx.hash)
    console.log(" Waiting for confirmation...")

    const receipt = await tx.wait()
    console.log(" Block:", receipt?.blockNumber)
    console.log(" Gas used:", receipt?.gasUsed.toString())

    // Verify the update
    const updatedFee = await paymentContract.imageFee()
    console.log("\n Updated Image Fee:", ethers.formatEther(updatedFee), "CELO")

    console.log("\n" + "=".repeat(60))
    console.log("  SUCCESS! Image fee updated to 1 CELO")
    console.log("=".repeat(60))
    console.log("\n Next steps:")
    console.log(" 1. Update .env.local: NEXT_PUBLIC_IMAGE_FEE=1.0")
    console.log(" 2. Update README.md pricing from 2.0 to 1.0 CELO")
    console.log(" 3. Redeploy frontend to apply changes")

  } catch (error: any) {
    console.error("\n ERROR:", error.message)

    if (error.message?.includes("caller is not the owner")) {
      console.error("\n The connected wallet is not the contract owner.")
      console.error(" Only the owner can update the image fee.")
    }

    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
