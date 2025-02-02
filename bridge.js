import fs from "fs/promises";  
import log from "./utils/logger.js";  
import iniBapakBudi from "./utils/banner.js";  
import { ethers } from "ethers";  
import readline from "readline";  
  
const USDT = "0x93C5d30a7509E60871B77A3548a5BD913334cd35";  
const USDC = "0xadbf21cCdFfe308a8d83AC933EF5D3c98830397F";  
const WBTC = "0x21472DF1B5d2b673F6444B41258C6460294a2C06";  
const BRIDGE_CONTRACT = "0x5E2C8EF3035feeC3056864512Aaf8f4dc88CaEe3";  
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/3DN4EyaWIGRgyimE133RK7jwBvmq-ADi";  
  
async function readWallets() {  
  try {  
    await fs.access("wallets.json");  
  
    const data = await fs.readFile("wallets.json", "utf-8");  
    return JSON.parse(data);  
  } catch (err) {  
    if (err.code === "ENOENT") {  
      log.info("No wallets found in wallets.json");  
      return [];  
    }  
    throw err;  
  }  
}  
  
async function readConfig(file) {  
  try {  
    const data = await fs.readFile(file, "utf-8");  
    return JSON.parse(data);  
  } catch (error) {  
    log.error("Error reading config file:", error.message);  
    return null;  
  }  
}  
  
async function askQuestion(question) {  
  const rl = readline.createInterface({  
    input: process.stdin,  
    output: process.stdout,  
  });  
  
  return new Promise((resolve) => {  
    rl.question(question, (answer) => {  
      rl.close();  
      resolve(answer);  
    });  
  });  
}  
  
export async function bridgeAsset(privateKey) {  
  const provider = new ethers.JsonRpcProvider(RPC_URL);  
  const wallet = new ethers.Wallet(privateKey, provider);  
  
  const contracts = [  
    { name: "USDT", address: USDT },  
    { name: "USDC", address: USDC },  
    { name: "WBTC", address: WBTC },  
  ];  
  
  for (const { name, address: contractAddress } of contracts) {  
    const abi = [  
      "function mint(address to, uint256 amount) external",  
      "function approve(address spender, uint256 amount) external returns (bool)",  
      "function bridgeAsset(uint32 destinationNetwork, address destinationAddress, uint256 amount, address token, bool forceUpdateGlobalExitRoot, bytes permitData) external",  
    ];  
    const contract = new ethers.Contract(contractAddress, abi, wallet);  
    const contractBridge = new ethers.Contract(BRIDGE_CONTRACT, abi, wallet);  
  
    const to = wallet.address;  
    const amount = ethers.parseUnits("10000", 6);  
  
    try {  
      log.info(`Minting ${ethers.formatUnits(amount, 6)} ${name} tokens to ${to}...`);  
  
      const tx = await contract.mint(to, amount);  
  
      await tx.wait();  
      log.info(`${name} Mint Transaction confirmed:`, tx.hash);  
  
      // Approve tokens  
      log.info(`Approving ${ethers.formatUnits(amount, 6)} ${name} tokens for ${BRIDGE_CONTRACT}...`);  
      const approveTx = await contract.approve(BRIDGE_CONTRACT, amount);  
  
      await approveTx.wait();  
      log.info(`${name} Approve Transaction confirmed:`, approveTx.hash);  
  
      // Bridge tokens  
      const randomAmount = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;  
      const bridgeAmount = randomAmount * 10 ** 6;  
      log.info(`Bridging ${randomAmount} ${name} tokens to Haust network...`);  
  
      const bridgeTx = await contractBridge.bridgeAsset(1, to, bridgeAmount, contractAddress, true, "0x", { gasLimit: 500000 });  
      await bridgeTx.wait();  
      log.info(`${name} Bridge Transaction confirmed:`, bridgeTx.hash);  
      console.log(`\n`);  
    } catch (error) {  
      log.error(`Error during ${name} minting:`, error.message || error);  
    }  
  }  
}  
  
// Function to send faucet to a wallet  
export async function sendFaucet(faucetAmount, addressRecipient, pvkey) {  
  log.info(`Sending Faucet ${faucetAmount} To Address ${addressRecipient}`);  
  try {  
    const provider = new ethers.JsonRpcProvider(RPC_URL);  
    const wallet = new ethers.Wallet(pvkey, provider);  
  
    const tx = {  
      to: addressRecipient,  
      value: ethers.parseEther(faucetAmount),  
      gasLimit: 21000,  
    };  
  
    const txResponse = await wallet.sendTransaction(tx);  
    await txResponse.wait();  
    log.info(`Transaction confirmed:`, txResponse.hash);  
  } catch (error) {  
    log.error("Error sending faucet:", error.message);  
  }  
}  
  
async function distributeFaucet(wallets) {  
  const faucetAmount = await askQuestion("How Many ETH You Want To Send to each address, example 0.01 : ");  
  try {  
    const config = await readConfig("./config.json");  
    const pk = config?.private_key_wallet_send_eth;  
    if (!pk) throw new Error("No private key found private_key_wallet_send_eth in config.json, setup it");  
    for (let i = 0; i < wallets.length; i++) {  
      const wallet = wallets[i];  
      await sendFaucet(faucetAmount, wallet.address, pk);  
    }  
  } catch (error) {  
    log.error("Error distributing faucet:", error.message);  
  }  
}  
  
async function main() {  
  log.info(iniBapakBudi);  
  const wallets = await readWallets();  
  if (wallets.length === 0) {  
    log.warn("No wallets to process.");  
    return;  
  }  
  
  log.info(`Found ${wallets.length} existing wallets...`);  
  log.info(`do you want to turn on auto distribute eth sepolia?`);  
  const isFacuet = await askQuestion("Make sure you setup private key on  in config.json and the wallet have sepolia eth (y/n) : ");  
  if (isFacuet === "y") {  
    await distributeFaucet(wallets);  
  }  
  try {  
    for (let i = 0; i < wallets.length; i++) {  
      const wallet = wallets[i];  
      log.info(`Starting Processing for wallet: ${wallet.address}`);  
      await bridgeAsset(wallet.privateKey);  
    }  
  } catch (error) {  
    log.error("Error processing wallet:", error.message);  
  }  
}  
  
main();  
