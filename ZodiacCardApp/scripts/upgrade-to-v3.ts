import { ethers, upgrades } from "hardhat"

async function main() {
  console.log("🚀 Upgrading ZodiacImagePayment to V3...")

  // Get the contract factory
  const ZodiacImagePayment_V3 = await ethers.getContractFactory("ZodiacImagePayment_V3")

  // Get the existing proxy address from environment
  const PROXY_ADDRESS = process.env.IMAGE_PAYMENT_CONTRACT_ADDRESS

  if (!PROXY_ADDRESS) {
    throw new Error("❌ IMAGE_PAYMENT_CONTRACT_ADDRESS not set in .env file")
  }

  console.log("📍 Existing proxy address:", PROXY_ADDRESS)

  try {
    // Upgrade the proxy to V3
    console.log("⏳ Upgrading proxy to V3 implementation...")
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ZodiacImagePayment_V3)
    await upgraded.waitForDeployment()

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
      await upgraded.getAddress()
    )

    console.log("✅ Upgrade successful!")
    console.log("📍 Proxy address (unchanged):", await upgraded.getAddress())
    console.log("📍 New implementation address:", implementationAddress)
    console.log("\n🎉 ZodiacImagePayment V3 is now live!")
    console.log("\nℹ️  No need to update NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS - it's the same proxy!")

  } catch (error: any) {
    if (error.message?.includes('is not registered')) {
      console.log("\n⚠️  Proxy not found in upgrades manifest.")
      console.log("This might be the first time using OpenZeppelin upgrades with this proxy.")
      console.log("\nOption 1: Force import the existing proxy")
      console.log("Option 2: Deploy a new V3 contract\n")

      // Try to force import
      console.log("Attempting to force import existing proxy...")
      await upgrades.forceImport(PROXY_ADDRESS, ZodiacImagePayment_V3)
      console.log("✅ Proxy imported. Now upgrading...")

      const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ZodiacImagePayment_V3)
      await upgraded.waitForDeployment()

      console.log("✅ Upgrade successful after import!")
      console.log("📍 Proxy address:", await upgraded.getAddress())
    } else {
      throw error
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error)
    process.exit(1)
  })
