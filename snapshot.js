const https = require("https");

const key = process.env.ALCHEMY_API_KEY;

if (!key) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

console.log("Key loaded:", key.length, "characters");
console.log("Key prefix:", key.substring(0, 5));
console.log("Key suffix:", key.substring(key.length - 4));

const url = `https://robinhood-mainnet.g.alchemy.com/v2/${key}`;

const body = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "eth_blockNumber",
  params: []
});

const req = https.request(
  url,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  },
  (res) => {
    let data = "";

    res.on("data", chunk => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("HTTP status:", res.statusCode);
      console.log("Response:", data);

      if (res.statusCode !== 200) {
        process.exit(1);
      }
    });
  }
);

req.on("error", err => {
  console.error("Request error:", err.message);
  process.exit(1);
});

req.write(body);
req.end();
