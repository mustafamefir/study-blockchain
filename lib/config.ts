/**
 * Network Configuration
 * 
 * Configure your IOTA networks and package IDs here
 */

import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit"

// Package IDs - These will be automatically filled when you run `npm run iota-deploy`
// DEVNET and MAINNET are left empty; TESTNET is wired to the deployed package ID.
export const DEVNET_PACKAGE_ID = "0x6183cd7c03abb85163b0a9e34a53bbabfadf4f24eb4c09376aa59b0d49840a8c"
export const TESTNET_PACKAGE_ID = "0x034c223f7392aaeeb15cd0d365bfd6ce29d48cded12294b3c93c3c45029b9401"
export const MAINNET_PACKAGE_ID = ""

// Network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      packageId: DEVNET_PACKAGE_ID,
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      packageId: MAINNET_PACKAGE_ID,
    },
  },
})

export { useNetworkVariable, useNetworkVariables, networkConfig }
