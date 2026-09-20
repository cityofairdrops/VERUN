const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const URL =
  "https://api.blockscout.com/4663/api/v2/blocks/68086309/transactions";

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
              new Error(`HTTP ${res.statusCode}: ${data}`)
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
  console.log("BLOCKSCOUT TRANSACTION FIELD INSPECTION");
  console.log("========================================");
  console.log("Chain: Robinhood Mainnet");
  console.log("Chain ID: 4663");
  console.log("Block: 68086309");
  console.log("");

  const data = await request(URL);

  if (!data || !Array.isArray(data.items)) {
    throw new Error("Unexpected Blockscout response");
  }

  console.log("Transactions returned:", data.items.length);
  console.log("");

  data.items.slice(0, 10).forEach((tx, index) => {
    console.log(`========== TRANSACTION ${index + 1} ==========`);

    console.log("hash:", tx.hash);
    console.log("block_number:", tx.block_number);
    console.log("status:", tx.status);
    console.log("from:", tx.from);
    console.log("to:", tx.to);
    console.log("value:", tx.value);
    console.log("method:", tx.method);
    console.log("transaction_types:", tx.transaction_types);
    console.log("fee:", tx.fee);
    console.log("raw input:", tx.raw_input);

    console.log("");
  });

  console.log("========================================");
  console.log("INSPECTION COMPLETE");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("INSPECTION FAILED");
  console.error(error.message);
  process.exit(1);
});    console.log("");
    console.log(
      "First transaction block:",
      data.items[0].block_number
    );

    console.log(
      "Last transaction block:",
      data.items[data.items.length - 1].block_number
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
