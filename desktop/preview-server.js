"use strict";

const { HqServer } = require("../lib/index.js");

const port = Number(process.argv[2]);
const configPath = process.argv[3];

const config = require(configPath);
const server = new HqServer(config);

const httpServer = server.listen(port, () => {
  process.stdout.write("ready");
});

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0));
});