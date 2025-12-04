const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying fresh ZodiacImagePayment V3 proxy...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const treasuryAddress = "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f";

  const ZodiacImagePayment_V3 = await ethers.getContractFactory("ZodiacImagePayment_V3");
  
  console.log("📦 Deploying proxy with V3 implementation...");
  
  const proxy = await upgrades.deployProxy(
    ZodiacImagePayment_V3,
    [deployer.address, treasuryAddress],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Deployment complete!");
  console.log("Proxy address:", proxyAddress);
  console.log("Implementation:", implAddress);
  console.log("Owner:", deployer.address);
  console.log("Treasury:", treasuryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
