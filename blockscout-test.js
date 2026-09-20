const https = require("https");

const API_KEY = process.env.BLOCKSCOUT_API_KEY;

if (!API_KEY) {
  throw new Error("BLOCKSCOUT_API_KEY is missing");
}

const URL =
  "https://api.blockscout.com/v2/api" +
  "?chainid=4663" +
  "&module=account" +
  "&action=txlist" +
  "&address=0x92f6a18290408a18A582420f44Fe2fafB1e43F72" +
  "&page=1" +
  "&offset=10" +
  "&sort=desc" +
  "&apikey=" + encodeURIComponent(API_KEY);

https.get(URL, (res) => {
  let data = "";

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("HTTP status:", res.statusCode);

    try {
      const json = JSON.parse(data);

      console.log(
        JSON.stringify(json, null, 2)
      );
    } catch {
      console.log(data);
    }
  });
}).on("error", error => {
  console.error(error);
  process.exit(1);
});
