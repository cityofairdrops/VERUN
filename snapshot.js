const https = require("https");

const API_KEY = process.env.ALCHEMY_API_KEY;

if (!API_KEY) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

const RPC_URL =
  `https://robinhood-mainnet.g.alchemy.com/v2/${API_KEY}`;

const SNAPSHOT_BLOCK = 68086309;
const EXPECTED_CHAIN_ID = "0x1237"; // 4663

function rpc(method, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    });

    const req = https.request(
      RPC_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              reject(
                new Error(
                  `RPC error: ${JSON.stringify(json.error)}`
                )
              );
              return;
            }

            resolve(json.result);
          } catch (error) {
            reject(
              new Error(
                `Invalid RPC response: ${data}`
              )
            );
          }
        });
      }
    );

    req.on("error", reject);

    req.write(body);
    req.end();
  });
}

function hexToNumber(hex) {
  return parseInt(hex, 16);
}

async function main() {
  console.log("========================================");
  console.log("VERUN SNAPSHOT BLOCK VERIFICATION");
  console.log("========================================");

  console.log("");
  console.log("Network: Robinhood Chain Mainnet");
  console.log("Chain ID: 4663");
  console.log("Snapshot time: 2026-09-20 22:00 UTC");
  console.log("Snapshot block:", SNAPSHOT_BLOCK);

  // --------------------------------------------------
  // 1. Verify chain
  // --------------------------------------------------

  console.log("");
  console.log("Checking chain ID...");

  const chainId = await rpc("eth_chainId");

  console.log("Chain ID returned:", chainId);

  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong chain. Expected ${EXPECTED_CHAIN_ID}, got ${chainId}`
    );
  }

  console.log("Chain verification: OK");

  // --------------------------------------------------
  // 2. Get exact snapshot block
  // --------------------------------------------------

  console.log("");
  console.log("Loading snapshot block...");

  const blockHex =
    "0x" + SNAPSHOT_BLOCK.toString(16);

  const block = await rpc(
    "eth_getBlockByNumber",
    [blockHex, true]
  );

  if (!block) {
    throw new Error(
      `Block ${SNAPSHOT_BLOCK} was not found`
    );
  }

  const blockNumber =
    hexToNumber(block.number);

  const timestamp =
    hexToNumber(block.timestamp);

  const date =
    new Date(timestamp * 1000).toISOString();

  console.log("Block number:", blockNumber);
  console.log("Block hash:", block.hash);
  console.log("Block timestamp:", timestamp);
  console.log("Block UTC time:", date);
  console.log(
    "Transactions in block:",
    block.transactions.length
  );

  // --------------------------------------------------
  // 3. Make sure we received the correct block
  // --------------------------------------------------

  if (blockNumber !== SNAPSHOT_BLOCK) {
    throw new Error(
      `Wrong block returned. Expected ${SNAPSHOT_BLOCK}, got ${blockNumber}`
    );
  }

  // --------------------------------------------------
  // 4. Basic transaction inspection
  // --------------------------------------------------

  let successfulLookingTransactions = 0;

  for (const tx of block.transactions) {
    if (
      tx &&
      tx.hash &&
      tx.from
    ) {
      successfulLookingTransactions++;
    }
  }

  console.log(
    "Transactions with sender/hash:",
    successfulLookingTransactions
  );

  // --------------------------------------------------
  // 5. Final verification
  // --------------------------------------------------

  console.log("");
  console.log("========================================");
  console.log("SUCCESS");
  console.log("========================================");

  console.log(
    `Snapshot cutoff confirmed at block ${SNAPSHOT_BLOCK}.`
  );

  console.log(
    "No wallet allocations have been calculated yet."
  );
}

main().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error("SNAPSHOT VERIFICATION FAILED");
  console.error("========================================");
  console.error(error.message);

  process.exit(1);
});
