import * as dotenv from "dotenv";
dotenv.config();
import { ethers, upgrades } from "hardhat";

/**
 * Direct deployment script for Celo mainnet
 * Uses @openzeppelin/hardhat-upgrades for UUPS proxy deployment
 */
async function main() {
  console.log("\n🚀 Starting Celo Mainnet Deployment...\n");

  // Get configuration from environment
  const ownerAddress = process.env.DEPLOYER_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const celoMintFee = process.env.CELO_MINT_FEE || "5.0";

  // Validate required environment variables
  if (!ownerAddress || !treasuryAddress) {
    throw new Error("❌ DEPLOYER_ADDRESS and TREASURY_ADDRESS must be set in .env");
  }

  console.log("📝 Deployment Configuration:");
  console.log("👤 Owner Address:", ownerAddress);
  console.log("💰 Treasury Address:", treasuryAddress);
  console.log("💵 Mint Fee:", celoMintFee, "CELO");
  console.log("🌐 Network: Celo Mainnet (Chain ID: 42220)\n");

  // Configuration
  const config = {
    name: "Zodiac NFT",
    symbol: "ZODIAC",
    mintFee: ethers.parseUnits(celoMintFee, 18),
  };

  console.log("🔧 Contract Configuration:");
  console.log("- Name:", config.name);
  console.log("- Symbol:", config.symbol);
  console.log("- Mint Fee:", ethers.formatUnits(config.mintFee, 18), "CELO\n");

  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("👷 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatUnits(balance, 18), "CELO");

  if (balance < ethers.parseUnits("1", 18)) {
    console.warn("⚠️  Warning: Low balance. You may need at least 1-2 CELO for deployment gas fees.\n");
  }

  // Deploy using OpenZeppelin upgrades plugin
  console.log("\n📦 Deploying ZodiacNFT with UUPS proxy...");
  const ZodiacNFT = await ethers.getContractFactory("ZodiacNFT");

  const proxy = await upgrades.deployProxy(
    ZodiacNFT,
    [
      config.name,
      config.symbol,
      config.mintFee,
      ownerAddress,
      treasuryAddress,
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("✅ Proxy deployed to:", proxyAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("✅ Implementation deployed to:", implementationAddress);

  // Get contract instance
  console.log("\n🔍 Verifying deployment...");
  const zodiacNFT = ZodiacNFT.attach(proxyAddress) as any;

  // Verify settings
  const contractOwner = await zodiacNFT.owner();
  const contractTreasury = await zodiacNFT.treasuryAddress();
  const contractMintFee = await zodiacNFT.mintFee();

  console.log("\n📝 Deployed Contract Details:");
  console.log("⚡️ Proxy Address:", proxyAddress);
  console.log("⚡️ Implementation Address:", implementationAddress);
  console.log("⚡️ Owner:", contractOwner);
  console.log("⚡️ Treasury:", contractTreasury);
  console.log("⚡️ Mint Fee:", ethers.formatUnits(contractMintFee, 18), "CELO");

  // Validation checks
  console.log("\n✅ Validation Checks:");
  console.log("Owner matches:", contractOwner.toLowerCase() === ownerAddress.toLowerCase() ? "✓" : "✗");
  console.log("Treasury matches:", contractTreasury.toLowerCase() === treasuryAddress.toLowerCase() ? "✓" : "✗");
  console.log("Mint fee matches:", contractMintFee === config.mintFee ? "✓" : "✗");

  // Save addresses to .env format
  console.log("\n📋 Add these to your .env file:");
  console.log(`PROXY_CONTRACT_ADDRESS=${proxyAddress}`);
  console.log(`IMPLEMENTATION_ADDRESS=${implementationAddress}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📊 View on Celoscan:");
  console.log(`Proxy: https://celoscan.io/address/${proxyAddress}`);
  console.log(`Implementation: https://celoscan.io/address/${implementationAddress}`);

  console.log("\n🔍 To verify the implementation contract:");
  console.log(`yarn hardhat verify --network celo ${implementationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
