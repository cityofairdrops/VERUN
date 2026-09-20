const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const BASE_URL =
  "https://api.blockscout.com/4663/api/v2/transactions";

const MAX_PAGES = 20;

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      },
      (res) => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(
                new Error(
                  `HTTP ${res.statusCode}: ${JSON.stringify(json)}`
                )
              );
              return;
            }

            resolve(json);
          } catch {
            reject(
              new Error(
                `Invalid response: ${data}`
              )
            );
          }
        });
      }
    ).on("error", reject);
  });
}

async function main() {
  console.log("========================================");
  console.log("BLOCKSCOUT CHAIN-WIDE TRANSACTION TEST");
  console.log("========================================");

  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Maximum pages:", MAX_PAGES);

  const start = Date.now();

  let url =
    `${BASE_URL}?filter=validated&items_count=50`;

  let totalTransactions = 0;
  let oldestBlock = null;
  let newestBlock = null;

  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`Requesting page ${page}...`);

    const json = await request(url);

    if (!Array.isArray(json.items)) {
      throw new Error(
        "Unexpected response: items array missing"
      );
    }

    const items = json.items;

    if (items.length === 0) {
      console.log("No more transactions.");
      break;
    }

    totalTransactions += items.length;

    for (const tx of items) {
      const blockNumber =
        Number(tx.block_number);

      if (
        newestBlock === null ||
        blockNumber > newestBlock
      ) {
        newestBlock = blockNumber;
      }

      if (
        oldestBlock === null ||
        blockNumber < oldestBlock
      ) {
        oldestBlock = blockNumber;
      }
    }

    console.log(
      `Page ${page}: ${items.length} transactions | ` +
      `blocks ${oldestBlock} → ${newestBlock}`
    );

    if (!json.next_page_params) {
      console.log("No next page.");
      break;
    }

    const params = new URLSearchParams();

    for (
      const [key, value]
      of Object.entries(json.next_page_params)
    ) {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }

    url =
      `${BASE_URL}?${params.toString()}`;
  }

  const seconds =
    (Date.now() - start) / 1000;

  console.log("");
  console.log("========== RESULT ==========");
  console.log(
    "Transactions retrieved:",
    totalTransactions
  );
  console.log("Newest block:", newestBlock);
  console.log("Oldest block:", oldestBlock);
  console.log(
    "Time:",
    seconds.toFixed(2),
    "seconds"
  );
  console.log("============================");
}

main().catch(error => {
  console.error("");
  console.error("TEST FAILED");
  console.error(error.message);
  process.exit(1);
});  console.log("");
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
