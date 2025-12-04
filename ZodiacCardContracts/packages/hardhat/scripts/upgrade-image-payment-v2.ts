import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Upgrading ZodiacImagePayment to V2 on Celo Mainnet...\n");

  const existingProxyAddress = process.env.NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS ||
                               process.env.EXISTING_IMAGE_PAYMENT_PROXY;

  if (!existingProxyAddress) {
    throw new Error("❌ EXISTING_IMAGE_PAYMENT_PROXY or NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS must be set in .env");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Upgrader Address: ${deployer.address}`);
  console.log(`📍 Existing Proxy: ${existingProxyAddress}\n`);

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} CELO\n`);

  // Get current implementation before upgrade
  const oldImplementation = await upgrades.erc1967.getImplementationAddress(existingProxyAddress);
  console.log(`📦 Current Implementation: ${oldImplementation}\n`);

  // Get the contract factory for V2
  const ZodiacImagePaymentV2 = await ethers.getContractFactory(
    "contracts/ZodiacImagePayment_V2.sol:ZodiacImagePayment"
  );

  console.log("⏳ Upgrading to V2...");
  const upgraded = await upgrades.upgradeProxy(
    existingProxyAddress,
    ZodiacImagePaymentV2,
    {
      kind: "uups"
    }
  );

  await upgraded.waitForDeployment();
  const upgradedAddress = await upgraded.getAddress();

  // Get new implementation address
  const newImplementation = await upgrades.erc1967.getImplementationAddress(upgradedAddress);

  console.log("\n✅ Upgrade Complete!\n");
  console.log(`📍 Proxy Address: ${upgradedAddress}`);
  console.log(`📦 Old Implementation: ${oldImplementation}`);
  console.log(`📦 New Implementation: ${newImplementation}`);
  console.log(`🌐 Network: Celo Mainnet (42220)\n`);

  // Get the current fee
  const currentFee = await upgraded.imageFee();
  console.log(`💰 Current Image Fee: ${ethers.formatEther(currentFee)} CELO\n`);

  console.log("🔄 Now setting fee to 1 CELO...");
  const setFeeTx = await upgraded.setImageFee(ethers.parseEther("1.0"));
  await setFeeTx.wait();

  const newFee = await upgraded.imageFee();
  console.log(`✅ Image Fee Updated: ${ethers.formatEther(newFee)} CELO\n`);

  console.log("📊 Upgrade Summary:");
  console.log(`   Proxy: ${upgradedAddress}`);
  console.log(`   Implementation: ${newImplementation}`);
  console.log(`   Image Fee: ${ethers.formatEther(newFee)} CELO`);
  console.log(`   CeloScan: https://celoscan.io/address/${upgradedAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  });
