import { network } from "@ignored/hardhat-vnext";
import { optimism as optimismChain } from "viem/chains";

const mainnet = await network.connect("edrMainnet", "l1");
const optimism = await network.connect("edrOp", "optimism");

const counterMainnet = await mainnet.viem.deployContract("Counter");

console.log("Counter deployed at", counterMainnet.address, "on mainnet");

await counterMainnet.write.inc();

console.log("Counter (mainnet) value: ", await counterMainnet.read.x());

try {
    const counterOp = await optimism.viem.getContractAt("Counter", counterMainnet.address);

    console.log("Counter (optimism) value: ", await counterOp.read.x());
} catch (e: any) {
  console.error(e.message);
}

