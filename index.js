const fs = require("fs");
const { ethers } = require("ethers");
const Web3 = require("web3");
const axios = require("axios");

const jsonRpcURL = "https://mainnet.infura.io/v3/YOUR_API_KEY";
const ethersProvider = new ethers.providers.JsonRpcProvider(jsonRpcURL);
const ethersBatchProvider = new ethers.providers.JsonRpcBatchProvider(
  jsonRpcURL
);
const web3 = new Web3(jsonRpcURL);

// first 10 transactions from block 13963630
const txs = [
  "0x3c57f0a6db04addeafcc1af06c1d279639293bb4dcfdbe2b350ec653748e2bf9",
  "0x24856ae84896f0ae447c195d891b1af4d26bc32ee116526a68d26b2e10b8d499",
  "0xbbb67e398c5ad74ff5751f9bcd6a9362bbc0239858e51b78e9a6175e0a5d3bc2",
  "0x8c247778642910018a9cc13a53ccb3e562ea793ceaad6560e73ab27402d3fb1b",
  "0x56fae1e4217025efecc3a292d635afc07ce7802a065358ab6f73eb7162b820d9",
  "0x381b2f4ba5742d4230bdbc48ec6b05b8db3c5d7af980801bdd752a750ba2d214",
  "0xbfb981b1bafc2496e5b855cdd4d7a297d2cb3552f31f87e70a237b1885be3cc4",
  "0x70ede3fa647fea231532e09f8b0f5b03687bf2b1e98796e279a60f4b914fddf8",
  "0x06f9c67a3dde605a989be1fcc77c4b1f8adcd8d00c5ef650a9ccb20235815096",
  "0x003744ec8b759cd837c9d10af4782cbc45c2d02e6ca579fd439a026fe26b810f",
];

async function fetchEthersReceipt(tx) {
  return ethersProvider.getTransactionReceipt(tx);
}

async function fetchEthersBatchReceipt(tx) {
  return ethersBatchProvider.getTransactionReceipt(tx);
}

async function fetchEthersRawReceipt(tx) {
  return ethersProvider.send("eth_getTransactionReceipt", [tx]);
}

async function fetchWeb3Receipt(tx) {
  return web3.eth.getTransactionReceipt(tx);
}

async function fetchWeb3RawReceipt(tx) {
  const { result } = await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        method: "eth_getTransactionReceipt",
        params: [tx],
        jsonrpc: "2.0",
        id: Date.now(),
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
  });
  return result;
}

async function fetchAxiosReceipt(tx) {
  const { data } = await axios.post(jsonRpcURL, {
    jsonrpc: "2.0",
    method: "eth_getTransactionReceipt",
    params: [tx],
    id: Date.now(),
  });
  return data.result;
}

const providerMap = {
  ethers: fetchEthersReceipt,
  ethersBatch: fetchEthersBatchReceipt,
  ethersRaw: fetchEthersRawReceipt,
  web3: fetchWeb3Receipt,
  web3Raw: fetchWeb3RawReceipt,
  axios: fetchAxiosReceipt,
};

(async function main() {
  const providers = Object.keys(providerMap);
  for (const provider of providers) {
    const fetchReceipt = providerMap[provider];
    console.log(`starting ${provider} test...`);
    const receipts = [];

    const start = Date.now();
    for (const tx of txs) {
      receipts.push(await fetchReceipt(tx));
    }
    console.log(
      `${provider} took ${(Date.now() - start) / txs.length} ms/receipt`
    );

    fs.writeFileSync(
      `${provider}_receipts.json`,
      JSON.stringify(receipts, null, 2)
    );
  }
})();
