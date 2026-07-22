const serverless = require("serverless-http");
const server = require("../../../wdd330-backend/server.js");

module.exports.handler = serverless(server);
