import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying ZodiacImagePayment contract to Celo Mainnet...\n");

  // Get deployment configuration
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const ownerAddress = process.env.OWNER_ADDRESS;

  if (!treasuryAddress || !ownerAddress) {
    throw new Error("❌ TREASURY_ADDRESS and OWNER_ADDRESS must be set in .env");
  }

  console.log("📋 Deployment Configuration:");
  console.log(`   Treasury Address: ${treasuryAddress}`);
  console.log(`   Owner Address: ${ownerAddress}\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Deployer Address: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} CELO\n`);

  if (balance < ethers.parseEther("0.5")) {
    console.warn("⚠️  Warning: Low balance. Ensure you have at least 0.5 CELO for deployment\n");
  }

  // Deploy ZodiacImagePayment as upgradeable proxy
  console.log("📦 Deploying ZodiacImagePayment proxy and implementation...");

  const ZodiacImagePayment = await ethers.getContractFactory("ZodiacImagePayment");

  const imagePayment = await upgrades.deployProxy(
    ZodiacImagePayment,
    [ownerAddress, treasuryAddress],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await imagePayment.waitForDeployment();
  const imagePaymentAddress = await imagePayment.getAddress();

  console.log("✅ ZodiacImagePayment deployed successfully!\n");
  console.log("📍 Contract Addresses:");
  console.log(`   Proxy Address: ${imagePaymentAddress}`);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(imagePaymentAddress);
  console.log(`   Implementation Address: ${implementationAddress}\n`);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const imageFee = await imagePayment.IMAGE_FEE();
  const contractTreasury = await imagePayment.treasuryAddress();
  const contractOwner = await imagePayment.owner();

  console.log(`   Image Fee: ${ethers.formatEther(imageFee)} CELO`);
  console.log(`   Treasury: ${contractTreasury}`);
  console.log(`   Owner: ${contractOwner}\n`);

  // Deployment summary
  console.log("=" .repeat(60));
  console.log("📝 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Proxy Address: ${imagePaymentAddress}`);
  console.log(`Implementation Address: ${implementationAddress}`);
  console.log(`Network: Celo Mainnet (42220)`);
  console.log(`Transaction Fee: ${ethers.formatEther(balance - await ethers.provider.getBalance(deployer.address))} CELO`);
  console.log("=" .repeat(60));
  console.log("\n📌 Next Steps:");
  console.log("1. Verify contract on CeloScan:");
  console.log(`   npx hardhat verify --network celo ${implementationAddress}`);
  console.log("\n2. Update .env with new contract address:");
  console.log(`   NEXT_PUBLIC_IMAGE_PAYMENT_CONTRACT_ADDRESS=${imagePaymentAddress}`);
  console.log("\n3. Test the contract:");
  console.log(`   npx hardhat run scripts/test-image-payment.ts --network celo`);
  console.log("\n✅ Deployment Complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
