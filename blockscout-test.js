const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const CONTRACT =
  "0x92f6a18290408a18A582420f44Fe2fafB1e43F72";

const MAX_PAGES = 100;
const PAGE_SIZE = 100;

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          if (json.status !== "1") {
            reject(
              new Error(
                `Blockscout error: ${JSON.stringify(json)}`
              )
            );
            return;
          }

          resolve(json.result);
        } catch {
          reject(
            new Error(`Invalid response: ${data}`)
          );
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("========================================");
  console.log("BLOCKSCOUT PAGINATION TEST");
  console.log("========================================");

  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Address:", CONTRACT);
  console.log("Pages:", MAX_PAGES);
  console.log("Transactions per page:", PAGE_SIZE);

  const start = Date.now();

  let totalTransactions = 0;
  let oldestBlock = null;
  let newestBlock = null;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      "https://api.blockscout.com/v2/api" +
      "?chainid=4663" +
      "&module=account" +
      "&action=txlist" +
      "&address=" + CONTRACT +
      "&page=" + page +
      "&offset=" + PAGE_SIZE +
      "&sort=desc" +
      "&apikey=" + encodeURIComponent(API_KEY);

    const transactions = await request(url);

    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log(`No more transactions at page ${page}`);
      break;
    }

    totalTransactions += transactions.length;

    const pageNewest =
      Number(transactions[0].blockNumber);

    const pageOldest =
      Number(
        transactions[transactions.length - 1].blockNumber
      );

    if (newestBlock === null) {
      newestBlock = pageNewest;
    }

    oldestBlock = pageOldest;

    console.log(
      `Page ${page}: ${transactions.length} tx | ` +
      `blocks ${pageOldest} → ${pageNewest}`
    );
  }

  const seconds =
    (Date.now() - start) / 1000;

  console.log("");
  console.log("========== RESULT ==========");
  console.log("Transactions retrieved:", totalTransactions);
  console.log("Newest block:", newestBlock);
  console.log("Oldest block:", oldestBlock);
  console.log("Time:", seconds.toFixed(2), "seconds");
  console.log("============================");
}

main().catch(error => {
  console.error("");
  console.error("TEST FAILED");
  console.error(error.message);
  process.exit(1);
});
