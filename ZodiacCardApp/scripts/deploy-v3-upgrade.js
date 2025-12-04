const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x52e4212bd4085296168A7f880DfB6B646d52Fe61";

  console.log("🔄 Upgrading ZodiacImagePayment V3...");
  console.log("Proxy:", PROXY_ADDRESS);

  // Get the new implementation contract
  const ZodiacImagePayment_V3 = await ethers.getContractFactory("ZodiacImagePayment_V3");

  console.log("📦 Deploying new implementation...");

  // Upgrade the proxy to the new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ZodiacImagePayment_V3);

  await upgraded.waitForDeployment();

  const newImplAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("✅ Upgrade complete!");
  console.log("New implementation:", newImplAddress);
  console.log("Proxy:", PROXY_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
