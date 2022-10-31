import * as nearAPI from "near-api-js";

const { keyStores } = nearAPI;

const keyStore = new keyStores.InMemoryKeyStore();

const defaultNetwork = process.env.REACT_APP_DEFAULT_NETWORK || "mainnet";

const CONTRACTS = {
  testnet: "contract.1638481328.burrow.testnet",
  mainnet: "contract.main.burrow.near",
} as { [key: string]: string };

export const CONTRACT_NAME = CONTRACTS[defaultNetwork];

const defaultConfig = {
  mainnet: {
    networkId: "mainnet",
    keyStore,
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://explorer.mainnet.near.org",
    headers: {},
  },
  testnet: {
    networkId: "testnet",
    keyStore,
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
    headers: {},
  },
  localnet: {
    networkId: "localnet",
    keyStore,
    nodeUrl: "http://127.0.0.1:8332",
    walletUrl: "http://127.0.0.1:8334",
    helperUrl: "http://127.0.0.1:8330",
    explorerUrl: "http://127.0.0.1:8331",
    headers: {},
  },
} as { [key: string]: any };

export const config = defaultConfig[defaultNetwork];
