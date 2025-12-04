import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔄 Upgrading ZodiacNFT to V2 on Celo Mainnet...\n");

  // Get deployment configuration
  const existingProxyAddress = process.env.EXISTING_NFT_PROXY;

  if (!existingProxyAddress) {
    throw new Error("❌ EXISTING_NFT_PROXY must be set in .env");
  }

  console.log("📋 Upgrade Configuration:");
  console.log(`   Existing Proxy Address: ${existingProxyAddress}\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Deployer Address: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} CELO\n`);

  if (balance < ethers.parseEther("0.5")) {
    console.warn("⚠️  Warning: Low balance. Ensure you have at least 0.5 CELO for upgrade\n");
  }

  // Verify existing proxy
  console.log("🔍 Verifying existing proxy...");
  const ZodiacNFT = await ethers.getContractAt("contracts/ZodiacNFT.sol:ZodiacNFT", existingProxyAddress);

  try {
    const currentFee = await ZodiacNFT.mintFee();
    const owner = await ZodiacNFT.owner();
    console.log(`   Current Mint Fee: ${ethers.formatEther(currentFee)} CELO`);
    console.log(`   Current Owner: ${owner}\n`);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(`❌ Deployer (${deployer.address}) is not the contract owner (${owner})`);
    }
  } catch (error) {
    throw new Error(`❌ Failed to verify existing proxy: ${error}`);
  }

  // Deploy new implementation
  console.log("📦 Deploying ZodiacNFT V2 implementation...");
  console.log("⚠️  Using unsafeSkipStorageCheck due to new security features (ReentrancyGuard, Pausable)");

  const ZodiacNFTV2 = await ethers.getContractFactory("contracts/ZodiacNFT_V2.sol:ZodiacNFT");
  const upgraded = await upgrades.upgradeProxy(existingProxyAddress, ZodiacNFTV2, {
    unsafeSkipStorageCheck: true
  });

  await upgraded.waitForDeployment();
  const upgradedAddress = await upgraded.getAddress();

  console.log("✅ ZodiacNFT upgraded successfully!\n");

  // Get new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(upgradedAddress);
  console.log("📍 Contract Addresses:");
  console.log(`   Proxy Address (unchanged): ${upgradedAddress}`);
  console.log(`   New Implementation Address: ${newImplementationAddress}\n`);

  // Update mint fee to 3 CELO
  console.log("💰 Updating mint fee to 3 CELO...");
  const newFee = ethers.parseEther("3.0");
  const tx = await upgraded.setMintFee(newFee);
  await tx.wait();
  console.log("✅ Mint fee updated successfully!\n");

  // Verify upgrade
  console.log("🔍 Verifying upgrade...");
  const updatedFee = await upgraded.mintFee();
  const contractOwner = await upgraded.owner();
  const nextTokenId = await upgraded.nextTokenId();

  console.log(`   Mint Fee: ${ethers.formatEther(updatedFee)} CELO`);
  console.log(`   Owner: ${contractOwner}`);
  console.log(`   Next Token ID: ${nextTokenId}\n`);

  // Upgrade summary
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("=" .repeat(60));
  console.log("📝 UPGRADE SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Proxy Address: ${upgradedAddress}`);
  console.log(`New Implementation: ${newImplementationAddress}`);
  console.log(`Network: Celo Mainnet (42220)`);
  console.log(`New Mint Fee: 3 CELO`);
  console.log(`Transaction Fee: ${ethers.formatEther(balance - finalBalance)} CELO`);
  console.log("=" .repeat(60));
  console.log("\n📌 Next Steps:");
  console.log("1. Verify new implementation on CeloScan:");
  console.log(`   npx hardhat verify --network celo ${newImplementationAddress}`);
  console.log("\n2. Update .env if proxy address changed:");
  console.log(`   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${upgradedAddress}`);
  console.log(`   NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS=${newImplementationAddress}`);
  console.log("\n3. Test the upgraded contract:");
  console.log(`   npx hardhat run scripts/test-zodiac-nft.ts --network celo`);
  console.log("\n✅ Upgrade Complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  });
