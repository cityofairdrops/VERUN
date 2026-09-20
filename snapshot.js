const https = require("https");

const apiKey = process.env.ALCHEMY_API_KEY;

if (!apiKey) {
  throw new Error("ALCHEMY_API_KEY is missing");
}

const url = `https://robinhood-mainnet.g.alchemy.com/v2/${apiKey}`;

const body = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "eth_chainId",
  params: []
});

const request = https.request(
  url,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  },
  (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("HTTP status:", res.statusCode);
      console.log("Robinhood RPC response:");
      console.log(data);

      if (res.statusCode !== 200) {
        process.exit(1);
      }

      try {
        const result = JSON.parse(data);

        if (result.result !== "0x1237") {
          console.error("Unexpected chain ID:", result.result);
          process.exit(1);
        }

        console.log("SUCCESS: Connected to Robinhood Chain mainnet.");
      } catch (error) {
        console.error("Invalid RPC response.");
        process.exit(1);
      }
    });
  }
);

request.on("error", (error) => {
  console.error("Request error:", error.message);
  process.exit(1);
});

request.write(body);
request.end();
