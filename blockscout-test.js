const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const SNAPSHOT_BLOCK = 68086309;

const url =
  `https://api.blockscout.com/4663/api/v2/blocks/${SNAPSHOT_BLOCK}/transactions`;

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

async function main() {
  console.log("========================================");
  console.log("BLOCKSCOUT SNAPSHOT BLOCK TEST");
  console.log("========================================");

  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Snapshot block:", SNAPSHOT_BLOCK);

  console.log("");
  console.log("Requesting block transactions...");

  const start = Date.now();

  const data = await request(url);

  const elapsed =
    (Date.now() - start) / 1000;

  console.log("");
  console.log("========== RESULT ==========");

  console.log(
    "Transactions returned:",
    Array.isArray(data.items)
      ? data.items.length
      : "unknown"
  );

  if (Array.isArray(data.items)) {
    for (const tx of data.items.slice(0, 5)) {
      console.log(
        tx.hash,
        "block:",
        tx.block_number
      );
    }
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
