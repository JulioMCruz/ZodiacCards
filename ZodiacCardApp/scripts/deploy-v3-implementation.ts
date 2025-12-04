import { ethers } from "hardhat"

async function main() {
  console.log("🚀 Deploying ZodiacImagePayment V3 Implementation...")

  const [deployer] = await ethers.getSigners()
  console.log("📍 Deploying with account:", deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO")

  // Deploy the V3 implementation contract
  console.log("\n⏳ Deploying V3 implementation...")
  const ZodiacImagePayment_V3 = await ethers.getContractFactory("ZodiacImagePayment_V3")
  const implementation = await ZodiacImagePayment_V3.deploy()
  await implementation.waitForDeployment()

  const implementationAddress = await implementation.getAddress()
  console.log("✅ V3 Implementation deployed at:", implementationAddress)

  console.log("\n📋 Next Steps:")
  console.log("1. Verify the implementation contract on Celoscan")
  console.log("2. Manually call upgradeTo() on the proxy contract:")
  console.log("   Proxy:", "0x52e4212bd4085296168A7f880DfB6B646d52Fe61")
  console.log("   New Implementation:", implementationAddress)
  console.log("\n🔗 Or use the proxy admin to upgrade")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
