const https = require("https");

const API_KEY = process.env.ALCHEMY_API_KEY;

if (!API_KEY) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

const RPC_URL =
  `https://robinhood-mainnet.g.alchemy.com/v2/${API_KEY}`;

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

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              reject(new Error(JSON.stringify(json.error)));
              return;
            }

            resolve(json.result);
          } catch {
            reject(new Error(`Invalid response: ${data}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const startBlock = 68000000;
  const blocksToTest = 100;

  console.log("Starting performance test...");
  console.log(`Testing ${blocksToTest} blocks`);
  console.log(`From block ${startBlock}`);

  const start = Date.now();

  let transactions = 0;

  for (let i = 0; i < blocksToTest; i++) {
    const blockNumber = startBlock + i;
    const hex =
      "0x" + blockNumber.toString(16);

    const block = await rpc(
      "eth_getBlockByNumber",
      [hex, true]
    );

    if (!block) {
      throw new Error(
        `Block ${blockNumber} unavailable`
      );
    }

    transactions += block.transactions.length;

    if ((i + 1) % 10 === 0) {
      console.log(
        `Processed ${i + 1}/${blocksToTest} blocks`
      );
    }
  }

  const seconds =
    (Date.now() - start) / 1000;

  console.log("");
  console.log("========== RESULT ==========");
  console.log("Blocks:", blocksToTest);
  console.log("Transactions:", transactions);
  console.log("Time:", seconds.toFixed(2), "seconds");
  console.log(
    "Blocks/sec:",
    (blocksToTest / seconds).toFixed(2)
  );
  console.log(
    "Estimated hours for full chain:",
    (
      68086309 / (blocksToTest / seconds) / 3600
    ).toFixed(2)
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
