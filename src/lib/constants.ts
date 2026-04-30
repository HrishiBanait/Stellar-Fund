export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Set to true to test UI without deploying contract
// Using MOCK_MODE for now - set to false when you have a deployed contract
export const MOCK_MODE = false;

// Placeholder contract ID - update this with your deployed contract
// For now, using mock mode to demonstrate full functionality
export const CONTRACT_ID =
  "CDJELKRKYJ2Q3J6G77TATFJMRU6D7ASXS7P3H26CKIBU3SWUE75OKQL3";

export const EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export enum WalletType {
  FREIGHTER = "freighter",
}

export const WALLET_INFO: Record<
  WalletType,
  { name: string; url: string }
> = {
  [WalletType.FREIGHTER]: {
    name: "Freighter",
    url: "https://www.freighter.app/",
  },
};

