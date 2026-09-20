const https = require("https");
const fs = require("fs");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const BASE_URL =
  "https://api.blockscout.com/4663/api/v2/transactions";

const SNAPSHOT_BLOCK = 68086309;
const ITEMS_COUNT = 50;
const MIN_TX = 10;

let requestCount = 0;
let transactionCount = 0;

const walletCounts = new Map();

function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${data}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(
              new Error(`Invalid JSON response: ${data}`)
            );
          }
        });
      }
    );

    req.on("error", reject);
  });
}

function isSuccessful(tx) {
  return (
    tx.status === "ok" ||
    tx.status === "success" ||
    tx.status === 1 ||
    tx.status === "1"
  );
}

function getWallet(tx) {
  if (!tx.from) {
    return null;
  }

  if (typeof tx.from === "string") {
    return tx.from;
  }

  if (tx.from.hash) {
    return tx.from.hash;
  }

  if (tx.from.address) {
    return tx.from.address;
  }

  return null;
}

function processTransaction(tx) {
  if (!tx) {
    return;
  }

  const block = Number(tx.block_number);

  if (!Number.isFinite(block)) {
    return;
  }

  if (block > SNAPSHOT_BLOCK) {
    return;
  }

  if (!isSuccessful(tx)) {
    return;
  }

  const wallet = getWallet(tx);

  if (!wallet || !wallet.startsWith("0x")) {
    return;
  }

  const address = wallet.toLowerCase();

  walletCounts.set(
    address,
    (walletCounts.get(address) || 0) + 1
  );
}

async function main() {
  console.log("========================================");
  console.log("VERUN AIRDROP SNAPSHOT SCANNER");
  console.log("========================================");

  console.log("");
  console.log("Network: Robinhood Chain Mainnet");
  console.log("Chain ID: 4663");
  console.log("Snapshot block:", SNAPSHOT_BLOCK);
  console.log("Minimum transactions:", MIN_TX);

  let params = {
    filter: "validated",
    block_number: SNAPSHOT_BLOCK,
    index: 999999999,
    items_count: ITEMS_COUNT
  };

  const startTime = Date.now();

  while (true) {
    requestCount++;

    const url =
      BASE_URL +
      `?filter=${params.filter}` +
      `&block_number=${params.block_number}` +
      `&index=${params.index}` +
      `&items_count=${params.items_count}`;

    console.log("");
    console.log(
      `Request #${requestCount}`
    );

    const data = await request(url);

    if (!data || !Array.isArray(data.items)) {
      throw new Error(
        "Unexpected Blockscout response"
      );
    }

    transactionCount += data.items.length;

    for (const tx of data.items) {
      processTransaction(tx);
    }

    const blocks = data.items
      .map((tx) => Number(tx.block_number))
      .filter(Number.isFinite);

    if (blocks.length > 0) {
      console.log(
        "Block range:",
        Math.max(...blocks),
        "→",
        Math.min(...blocks)
      );
    }

    console.log(
      "Transactions scanned:",
      transactionCount
    );

    console.log(
      "Wallets found:",
      walletCounts.size
    );

    if (!data.next_page_params) {
      break;
    }

    params = data.next_page_params;
  }

  const eligibleWallets = [];

  for (const [wallet, count] of walletCounts) {
    if (count >= MIN_TX) {
      eligibleWallets.push({
        wallet,
        transaction_count: count
      });
    }
  }

  eligibleWallets.sort(
    (a, b) =>
      b.transaction_count -
      a.transaction_count
  );

  const result = {
    snapshot_block: SNAPSHOT_BLOCK,
    minimum_transactions: MIN_TX,
    transactions_scanned: transactionCount,
    wallets_found: walletCounts.size,
    eligible_wallets: eligibleWallets.length,
    wallets: eligibleWallets
  };

  fs.writeFileSync(
    "snapshot-wallet-counts.json",
    JSON.stringify(result, null, 2)
  );

  const seconds =
    (Date.now() - startTime) / 1000;

  console.log("");
  console.log("========================================");
  console.log("SNAPSHOT COMPLETE");
  console.log("========================================");

  console.log(
    "Transactions scanned:",
    transactionCount
  );

  console.log(
    "Wallets found:",
    walletCounts.size
  );

  console.log(
    "Eligible wallets (10+):",
    eligibleWallets.length
  );

  console.log(
    "Time:",
    seconds.toFixed(2),
    "seconds"
  );

  console.log("");
  console.log(
    "Created: snapshot-wallet-counts.json"
  );
}

main().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error("SCANNER FAILED");
  console.error("========================================");
  console.error(error.message);
  process.exit(1);
});
