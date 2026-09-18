const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({ service: "HQ", message: "Server time service" });
});

app.get("/time", (req, res) => {
  const now = new Date();
  res.json({
    iso: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
    utc: now.toUTCString(),
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`HQ time service listening on port ${port}`);
});