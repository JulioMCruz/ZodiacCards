import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("\n🚀 Deploying Fresh ZodiacNFT V3 Contract...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO\n");

  // Get configuration from env
  const ownerAddress = process.env.DEPLOYER_ADDRESS || deployer.address;
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const mintFee = ethers.parseEther("2.0"); // 2 CELO mint fee for V3

  console.log("📝 Configuration:");
  console.log("- Name: Zodiac NFT V3");
  console.log("- Symbol: ZODIAC");
  console.log("- Owner:", ownerAddress);
  console.log("- Treasury:", treasuryAddress);
  console.log("- Mint Fee:", ethers.formatEther(mintFee), "CELO\n");

  // Deploy fresh UUPS proxy - use V2 contract (fully qualified name)
  const ZodiacNFT = await ethers.getContractFactory("contracts/ZodiacNFT_V2.sol:ZodiacNFT");

  console.log("⏳ Deploying proxy and implementation...");
  const zodiacNFT = await upgrades.deployProxy(
    ZodiacNFT,
    [
      "Zodiac NFT V3",
      "ZODIAC",
      mintFee,
      ownerAddress,
      treasuryAddress
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await zodiacNFT.waitForDeployment();
  const proxyAddress = await zodiacNFT.getAddress();

  console.log("\n✅ Deployment successful!");
  console.log("📍 Proxy Address:", proxyAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("📍 Implementation Address:", implementationAddress);

  // Verify settings
  const contractOwner = await zodiacNFT.owner();
  const contractTreasury = await zodiacNFT.treasuryAddress();
  const contractMintFee = await zodiacNFT.mintFee();
  const nextTokenId = await zodiacNFT.nextTokenId();

  console.log("\n🔍 Contract Verification:");
  console.log("- Owner:", contractOwner);
  console.log("- Treasury:", contractTreasury);
  console.log("- Mint Fee:", ethers.formatEther(contractMintFee), "CELO");
  console.log("- Next Token ID:", nextTokenId.toString());

  // Save deployment info
  const deploymentInfo = {
    network: "celo-alfajores",
    timestamp: new Date().toISOString(),
    proxy: proxyAddress,
    implementation: implementationAddress,
    owner: contractOwner,
    treasury: contractTreasury,
    mintFee: ethers.formatEther(contractMintFee) + " CELO",
    nextTokenId: nextTokenId.toString()
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✨ Next Steps:");
  console.log("1. Update NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in ZodiacCardApp/.env");
  console.log("2. Verify contract on Celoscan:");
  console.log(`   npx hardhat verify --network celoAlfajores ${implementationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
