const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const BASE_URL =
  "https://api.blockscout.com/4663/api/v2/transactions";

const SNAPSHOT_BLOCK = 68086309;
const PAGE_SIZE = 50;

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
              new Error(`Invalid response: ${data}`)
            );
          }
        });
      }
    ).on("error", reject);
  });
}

async function main() {
  console.log("========================================");
  console.log("BLOCKSCOUT SNAPSHOT-BLOCK TEST");
  console.log("========================================");

  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Target snapshot block:", SNAPSHOT_BLOCK);

  const url =
    `${BASE_URL}` +
    `?filter=validated` +
    `&block_number=${SNAPSHOT_BLOCK}` +
    `&items_count=${PAGE_SIZE}`;

  console.log("");
  console.log("Requesting:");
  console.log(
    `${BASE_URL}?filter=validated&block_number=${SNAPSHOT_BLOCK}&items_count=${PAGE_SIZE}`
  );

  const start = Date.now();

  const json = await request(url);

  const seconds =
    (Date.now() - start) / 1000;

  if (!Array.isArray(json.items)) {
    throw new Error(
      `Unexpected response: ${JSON.stringify(json)}`
    );
  }

  console.log("");
  console.log("========== RESULT ==========");

  console.log(
    "Transactions returned:",
    json.items.length
  );

  if (json.items.length > 0) {
    const blocks =
      json.items.map(tx => Number(tx.block_number));

    console.log(
      "Newest returned block:",
      Math.max(...blocks)
    );

    console.log(
      "Oldest returned block:",
      Math.min(...blocks)
    );

    console.log("");
    console.log("First transaction block:");
    console.log(json.items[0].block_number);

    console.log(
      "Last transaction block:"
    );
    console.log(
      json.items[json.items.length - 1].block_number
    );
  }

  console.log("");
  console.log(
    "Has next page:",
    Boolean(json.next_page_params)
  );

  if (json.next_page_params) {
    console.log(
      "Next page parameters:",
      JSON.stringify(
        json.next_page_params,
        null,
        2
      )
    );
  }

  console.log("");
  console.log(
    "Request time:",
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
});    }

    console.log(
      `Page ${page}: ${items.length} transactions`
    );

    console.log(
      `Current block range: ${oldestBlock} → ${newestBlock}`
    );

    if (!json.next_page_params) {
      console.log("No next page.");
      break;
    }

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(json.next_page_params)) {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }

    url = `${BASE_URL}?${params.toString()}`;
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

main().catch((error) => {
  console.error("");
  console.error("TEST FAILED");
  console.error(error.message);
  process.exit(1);
});
