import { ethers } from "hardhat"

async function main() {
    const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS || "0x415Df58904f56A159748476610B8830db2548158"
    
    console.log("\n🔍 Checking ZodiacNFT Contract Mint Fee...\n")
    console.log("📍 Proxy Address:", proxyAddress)
    
    const zodiacNFT = await ethers.getContractAt("ZodiacNFT", proxyAddress)
    
    const mintFee = await zodiacNFT.mintFee()
    const mintFeeInCELO = ethers.formatEther(mintFee)
    
    console.log("\n💰 Current Mint Fee:", mintFeeInCELO, "CELO")
    console.log("💰 Mint Fee (wei):", mintFee.toString())
    
    const expectedFee = ethers.parseEther("10.0")
    const isCorrect = mintFee === expectedFee
    
    console.log("\n✅ Expected:", ethers.formatEther(expectedFee), "CELO")
    console.log(isCorrect ? "✅ Mint fee is CORRECT (10 CELO)" : "❌ Mint fee is INCORRECT")
    
    if (!isCorrect) {
        console.log("\n⚠️  Run the update script:")
        console.log("   yarn hardhat run scripts/updateMintFee.ts --network celo")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error)
        process.exit(1)
    })
