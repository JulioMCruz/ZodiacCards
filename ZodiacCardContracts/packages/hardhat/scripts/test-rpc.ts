import * as dotenv from "dotenv";
dotenv.config();

console.log("CELO_ALFAJORES_RPC_URL:", process.env.CELO_ALFAJORES_RPC_URL);
console.log("Fallback: https://rpc.ankr.com/celo_alfajores");
console.log("\nUsing:", process.env.CELO_ALFAJORES_RPC_URL || "https://rpc.ankr.com/celo_alfajores");
