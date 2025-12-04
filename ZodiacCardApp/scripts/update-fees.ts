import { ethers } from "hardhat"

async function main() {
  console.log("🔄 Updating contract fees to 2 CELO...")

  const [deployer] = await ethers.getSigners()
  console.log("📍 Updating with account:", deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO")

  // Contract addresses from .env
  const IMAGE_PAYMENT_ADDRESS = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS
  const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS

  if (!IMAGE_PAYMENT_ADDRESS || !NFT_ADDRESS) {
    throw new Error("❌ Contract addresses not set in .env file")
  }

  const NEW_IMAGE_FEE = ethers.parseEther("2.0") // 2 CELO
  const NEW_MINT_FEE = ethers.parseEther("2.0") // 2 CELO

  try {
    // Update Image Payment contract fee
    console.log("\n📝 Updating Image Payment contract fee...")
    console.log("   Contract:", IMAGE_PAYMENT_ADDRESS)
    console.log("   New fee:", ethers.formatEther(NEW_IMAGE_FEE), "CELO")

    const ImagePayment = await ethers.getContractAt(
      "ZodiacImagePayment_V3",
      IMAGE_PAYMENT_ADDRESS
    )

    // Check current fee
    const currentImageFee = await ImagePayment.imageFee()
    console.log("   Current fee:", ethers.formatEther(currentImageFee), "CELO")

    if (currentImageFee !== NEW_IMAGE_FEE) {
      const tx1 = await ImagePayment.setImageFee(NEW_IMAGE_FEE)
      console.log("   Transaction hash:", tx1.hash)
      await tx1.wait()
      console.log("   ✅ Image fee updated to 2 CELO")
    } else {
      console.log("   ℹ️  Fee already set to 2 CELO")
    }

    // Update NFT contract mint fee
    console.log("\n📝 Updating NFT contract mint fee...")
    console.log("   Contract:", NFT_ADDRESS)
    console.log("   New fee:", ethers.formatEther(NEW_MINT_FEE), "CELO")

    const NFT = await ethers.getContractAt("ZodiacNFT", NFT_ADDRESS)

    // Check current fee
    const currentMintFee = await NFT.mintFee()
    console.log("   Current fee:", ethers.formatEther(currentMintFee), "CELO")

    if (currentMintFee !== NEW_MINT_FEE) {
      const tx2 = await NFT.setMintFee(NEW_MINT_FEE)
      console.log("   Transaction hash:", tx2.hash)
      await tx2.wait()
      console.log("   ✅ Mint fee updated to 2 CELO")
    } else {
      console.log("   ℹ️  Fee already set to 2 CELO")
    }

    console.log("\n🎉 All fees updated successfully!")
    console.log("\n📋 Summary:")
    console.log("   Image Generation: 2 CELO")
    console.log("   NFT Minting: 2 CELO")
    console.log("   Total for image → NFT: 4 CELO")

  } catch (error: any) {
    if (error.message?.includes('Ownable: caller is not the owner')) {
      console.error("\n❌ Error: Not the contract owner")
      console.error("   Only the contract owner can update fees")
    } else {
      console.error("\n❌ Error updating fees:", error.message)
    }
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Update failed:", error)
    process.exit(1)
  })
