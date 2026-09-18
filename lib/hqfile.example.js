// HQ server definition.
// Used by the HQ Factory app and by future projects via the hq-server library.
// Each route is a path -> handler. Handlers receive a ctx object and return
// JSON-serializable data. Handlers MUST be self-contained (only use ctx + JS).
module.exports = {
  name: "time-server",
  routes: {
    "/": async (ctx) => ({
      service: "time-server",
      message: "Public server powered by HQ",
      time: ctx.iso,
    }),

    "/time": async (ctx) => ({
      iso: ctx.iso,
      unix: ctx.unix,
      utc: ctx.utc,
    }),

    "/whoami": async () => ({
      platform: "node",
      runtime: "netlify-functions",
    }),

    // Routes may also specify a method (GET/POST/PUT/DELETE).
    "/echo": {
      method: ["POST"],
      handler: async (ctx) => ({
        sent: ctx.body,
        query: ctx.query,
        receivedAt: ctx.iso,
      }),
    },

    "/hello": async (ctx) => ({
      message: "Hello, " + (ctx.query.name || "world") + "!",
    }),
  },
};