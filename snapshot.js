const https = require("https");

const apiKey = process.env.ALCHEMY_API_KEY;

if (!apiKey) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

const RPC_URL = `https://robinhood-mainnet.g.alchemy.com/v2/${apiKey}`;

function rpc(method, params) {
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
  const snapshotBlock = 68061668;
  const hexBlock = "0x" + snapshotBlock.toString(16);

  console.log("Testing Robinhood historical access...");
  console.log("Snapshot block:", snapshotBlock);
  console.log("Hex block:", hexBlock);

  const block = await rpc("eth_getBlockByNumber", [
    hexBlock,
    true
  ]);

  if (!block) {
    throw new Error("Snapshot block was not found.");
  }

  console.log("Block number:", parseInt(block.number, 16));
  console.log("Block hash:", block.hash);
  console.log("Timestamp:", parseInt(block.timestamp, 16));
  console.log("Transactions in block:", block.transactions.length);

  console.log("");
  console.log("SUCCESS: Historical snapshot block is accessible.");
}

main().catch(error => {
  console.error("Snapshot test failed:");
  console.error(error.message);
  process.exit(1);
});
