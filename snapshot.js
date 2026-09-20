const https = require("https");

const apiKey = process.env.ALCHEMY_API_KEY;

if (!apiKey) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

const url = `https://robinhood-mainnet.g.alchemy.com/v2/${apiKey}`;

const body = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "eth_blockNumber",
  params: []
});

const request = https.request(
  url,
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
      console.log("Robinhood RPC response:");
      console.log(data);

      if (res.statusCode !== 200) {
        process.exit(1);
      }
    });
  }
);

request.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

request.write(body);
request.end();
