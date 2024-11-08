import { network } from "@ignored/hardhat-vnext";
import { formatEther, getContract, parseEther } from "viem";
import { optimism as optimismChain } from "viem/chains";

const mainnet = await network.connect("edrMainnet", "l1");
const optimism = await network.connect("edrOp", "optimism");

const l1PublicClient = await mainnet.viem.getPublicClient();
const [l1WalletClient] = await mainnet.viem.getWalletClients();

const opPublicClient = await optimism.viem.getPublicClient();
const [receiver] = await optimism.viem.getWalletClients();

const l1StandardBridgeAddress = optimismChain.contracts.l1StandardBridge[1].address;
const l1StandardBridgeAbi = [
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "minGasLimit",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "bridgeETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function depositERC20() {
  try {
    const l1StandardBridgeContract = getContract({
      address: l1StandardBridgeAddress,
      client: {
        public: l1PublicClient,
        wallet: l1WalletClient,
      },
      abi: l1StandardBridgeAbi,
    });

    // Initiate the token deposit to Optimism
    const bridgeTxHash = await l1StandardBridgeContract.write.bridgeETH([
      2000000, // minGasLimit
      '0x',    // data
    ], {
      value: parseEther('100'),
    });
    console.log('Bridge transaction sent:', bridgeTxHash);

    // Wait for the deposit transaction to be mined
    const receipt = await l1PublicClient.waitForTransactionReceipt({ hash: bridgeTxHash });
    console.log('Bridge transaction confirmed:', receipt);

    console.log('Receiver balance on Optimism:', await opPublicClient.getBalance(receiver.account));

  } catch (error) {
    console.error('Error in bridging ETH:', error);
  }
}

depositERC20();
