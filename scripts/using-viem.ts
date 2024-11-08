import { network } from "@ignored/hardhat-vnext";

const { viem } = await network.connect("edrOp", "optimism");

const publicClient = await viem.getPublicClient();
const accounts = await viem.getWalletClients();

console.log("Accounts:", accounts);

const sender = accounts[0];

console.log("Sender:", sender);

console.log(
  "Sender balance: ",
  await publicClient.getBalance(sender.account)
);

console.log("Sending 1 gwei from", sender, "to", sender);

console.log("Estimating L1 gas first");

const l1Gas = await publicClient.estimateL1Gas({
  account: sender.account.address,
  to: sender.account.address,
  value: 1n,
});

console.log("Estimated L1 gas:", l1Gas);

const tx = await sender.sendTransaction({
  to: sender.account.address,
  value: 1n,
});

console.log("Transaction hash:", tx);

const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

console.log("Transaction receipt:", receipt);
