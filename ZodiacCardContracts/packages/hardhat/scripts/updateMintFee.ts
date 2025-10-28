import { ethers, network } from "hardhat"

async function main() {
    // Ensure we're on Celo Mainnet
    if (network.name !== "celo") {
        throw new Error("This script must be run on Celo Mainnet network")
    }
    console.log("🌍 Network:", network.name)

    // Get owner private key from .env
    const ownerPrivateKey = process.env.OWNER_ADDRESS_PRIVATE_KEY
    if (!ownerPrivateKey) {
        throw new Error("OWNER_ADDRESS_PRIVATE_KEY not set in .env")
    }

    // Get proxy address from .env
    const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS
    if (!proxyAddress) {
        throw new Error("PROXY_CONTRACT_ADDRESS not set in .env")
    }

    // New mint fee: 10 CELO (18 decimals for native CELO)
    const newMintFeeCELO = "10.0"

    // Create a wallet instance
    const provider = ethers.provider
    const wallet = new ethers.Wallet(ownerPrivateKey, provider)
    console.log("🔑 Using address:", wallet.address)

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address)
    console.log("💵 Wallet balance:", ethers.formatEther(balance), "CELO")

    // Convert the fee to CELO decimals (18)
    const newMintFee = ethers.parseEther(newMintFeeCELO)

    // Get contract instance connected to owner wallet
    const zodiacNFT = await ethers.getContractAt("ZodiacNFT", proxyAddress, wallet)

    // Get current mint fee for comparison
    const currentMintFee = await zodiacNFT.mintFee()
    console.log("\n💰 Current mint fee:", ethers.formatEther(currentMintFee), "CELO")
    console.log("💰 New mint fee:", ethers.formatEther(newMintFee), "CELO")

    // Check if wallet is owner
    const owner = await zodiacNFT.owner()
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error(`Signer is not the contract owner. Owner is ${owner}`)
    }

    // Check if the fee is actually different
    if (currentMintFee === newMintFee) {
        console.log("\n⚠️ New fee is the same as current fee. No update needed.")
        return
    }

    try {
        console.log("\n🚀 Updating mint fee on Celo Mainnet...")
        const tx = await zodiacNFT.setMintFee(newMintFee)
        console.log("⏳ Transaction hash:", tx.hash)
        console.log(`📍 View on Blockscout: https://celo.blockscout.com/tx/${tx.hash}`)
        console.log("Waiting for confirmation...")

        // Wait for transaction confirmation with 2 blocks for Celo
        const receipt = await tx.wait(2)
        if (!receipt) throw new Error("Transaction failed")

        console.log("✅ Transaction confirmed in block:", receipt.blockNumber)
        console.log(`📍 Block Explorer: https://celo.blockscout.com/block/${receipt.blockNumber}`)

        // Verify the new fee
        const updatedMintFee = await zodiacNFT.mintFee()
        console.log("\n✅ New mint fee verified:", ethers.formatEther(updatedMintFee), "CELO")
        console.log("\n📝 Don't forget to update the UI .env file:")
        console.log(`   NEXT_PUBLIC_CELO_MINT_PRICE="10.0"`)

    } catch (error) {
        console.error("❌ Error updating mint fee:", error)
        throw error
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    }) 