const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const SNAPSHOT_BLOCK = 68086309;
const ITEMS_COUNT = 100;

const url =
  "https://api.blockscout.com/4663/api/v2/transactions" +
  "?filter=validated" +
  `&block_number=${SNAPSHOT_BLOCK}` +
  "&index=999999999" +
  `&items_count=${ITEMS_COUNT}`;

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
              new Error(
                `Invalid JSON response: ${data}`
              )
            );
          }
        });
      }
    );

    req.on("error", reject);
  });
}

async function main() {
  console.log("========================================");
  console.log("BLOCKSCOUT PAGE SIZE TEST");
  console.log("========================================");

  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Snapshot block:", SNAPSHOT_BLOCK);
  console.log("Requested items:", ITEMS_COUNT);

  console.log("");
  console.log("Requesting...");

  const start = Date.now();

  const data = await request(url);

  const elapsed =
    (Date.now() - start) / 1000;

  if (!Array.isArray(data.items)) {
    throw new Error(
      `Unexpected response: ${JSON.stringify(data)}`
    );
  }

  console.log("");
  console.log("========== RESULT ==========");

  console.log(
    "Transactions returned:",
    data.items.length
  );

  if (data.items.length > 0) {
    const blocks = data.items.map(
      (tx) => Number(tx.block_number)
    );

    console.log(
      "Newest returned block:",
      Math.max(...blocks)
    );

    console.log(
      "Oldest returned block:",
      Math.min(...blocks)
    );
  }

  console.log("");

  if (data.next_page_params) {
    console.log("Has next page: YES");
    console.log(
      "Next page parameters:"
    );
    console.log(
      JSON.stringify(
        data.next_page_params,
        null,
        2
      )
    );
  } else {
    console.log("Has next page: NO");
  }

  console.log("");

  console.log(
    "Request time:",
    elapsed.toFixed(2),
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
