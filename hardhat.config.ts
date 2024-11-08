import {
  type HardhatUserConfig,
} from "@ignored/hardhat-vnext/config";

import HardhatViem from "@ignored/hardhat-vnext-viem";



const config: HardhatUserConfig = {
  plugins: [
    HardhatViem,
  ],
  solidity: {
    version: "0.8.24",
  },
  networks: {
    edrMainnet: {
      type: "edr",
      chainId: 1,
      chainType: "l1"
    },
    edrOp: {
      type: "edr",
      chainId: 10,
      chainType: "optimism",
    },
  },
};

export default config;
