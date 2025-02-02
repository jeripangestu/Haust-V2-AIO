import { ethers } from "ethers";
import solc from "solc";
import fs from "fs/promises";
import banner from "./utils/banner.js";
import log from "./utils/logger.js";

const provider = new ethers.JsonRpcProvider("https://haust-network-testnet-rpc.eu-north-2.gateway.fm");

export async function readWallets() {
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

// Solidity contract source
const contractSource = `
pragma solidity ^0.8.0;

contract Token {
    string public name = "Haust Token";
    string public symbol = "HAUS";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);

    constructor(uint256 _initialSupply) {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function mint(address _to, uint256 _value) public {
        totalSupply += _value;
        balanceOf[_to] += _value;
        emit Mint(_to, _value);
    }
}
`;

// Compile contract
function compileContract() {
  const input = {
    language: "Solidity",
    sources: { "Token.sol": { content: contractSource } },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractData = output.contracts["Token.sol"].Token;
  return { abi: contractData.abi, bytecode: contractData.evm.bytecode.object };
}
async function transferTokens(contract) {
  log.info(`Trying to transfer token to random address...`);
  const randomCounts = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
  for (let i = 0; i < randomCounts; i++) {
    const wallet = ethers.Wallet.createRandom();
    const recipient = wallet.address;
    const randomAmount = Math.floor(Math.random() * (10000 - 10 + 1)) + 10;
    const amount = ethers.parseUnits(randomAmount.toString(), 18);

    try {
      const transferTx = await contract.transfer(recipient, amount);
      await transferTx.wait();
      log.info(`Transfer ${randomAmount} tokens to ${recipient}`);
    } catch (error) {
      log.error(`Failed to transfer tokens: ${error.message}`);
    }
  }
}

// Deploy contract
async function deployContract(wallet, contractData) {
  try {
    const gasLimit = 5000000;
    const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, wallet);
    const initialSupply = ethers.parseUnits("1000000", 18);
    const contract = await factory.deploy(initialSupply, { gasLimit });
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    log.info(`Contract deployed successfully: ${contractAddress}`);
    await transferTokens(contract);
  } catch (error) {
    log.error(`Failed to deploy contract for ${wallet.address}: ${error?.shortMessage || error.message}`);
  }
}

// Deploy contracts for all wallets
async function deployContractsToAllWallets() {
  log.warn(banner);

  const wallets = await readWallets();
  if (!wallets || wallets.length === 0) {
    log.error("No wallets found. Please create wallets first.");
    process.exit(1);
  }

  log.info(`Found ${wallets.length} existing wallets...`);
  const contractData = compileContract();

  try {
    for (const walletData of wallets) {
      const wallet = new ethers.Wallet(walletData.privateKey, provider);
      log.info(`Deploying contract for wallet: ${wallet.address}`);
      await deployContract(wallet, contractData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    log.warn("All contracts deployed successfully. This script will run every day, so leave it running.");
  } catch (error) {
    log.error(`Error during contract deployment: ${error.message}`);
  }
}

// Fungsi untuk menampilkan timer mundur
function startTimer(durationInSeconds) {
  let remainingTime = durationInSeconds;

  const interval = setInterval(() => {
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    process.stdout.write(`\rNext run in: ${hours}h ${minutes}m ${seconds}s`);
    remainingTime--;

    if (remainingTime < 0) {
      clearInterval(interval);
      process.stdout.write("\n");
    }
  }, 1000);
}

// Menjalankan deploy pertama kali dan menampilkan timer mundur
async function run() {
  await deployContractsToAllWallets();
  startTimer(24 * 60 * 60); // 24 jam dalam detik

  setInterval(async () => {
    await deployContractsToAllWallets();
    startTimer(24 * 60 * 60);
  }, 24 * 60 * 60 * 1000); // 24 jam dalam milidetik
}

run();