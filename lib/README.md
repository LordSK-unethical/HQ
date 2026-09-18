# hq-server

Reusable library for spinning up **quick public servers** on Netlify. Define routes in a simple `hqfile`, test them locally, then export a standalone Netlify serverless function and deploy with one command.

## Usage

```js
const { HqServer } = require("./path/to/lib"); // or `@hq/server` when published

const server = new HqServer({
  name: "my-api",
  routes: {
    "/": async (ctx) => ({ hello: "world" }),
    "/time": async (ctx) => ({ iso: ctx.iso, unix: ctx.unix, utc: ctx.utc }),
    "/echo": {
      method: ["POST"],
      handler: async (ctx) => ({ youSent: ctx.body }),
    },
  },
});
```

### 1. Run locally (dev server)

```js
server.listen(3000); // GET http://localhost:3000/time
```

Useful helpers:
- `GET http://localhost:3000/_hq/routes` — list of registered routes

### 2. Export a standalone Netlify server

```js
server.exportNetlify("./deploy");
```

Writes a self-contained project:

```
deploy/
  netlify.toml              # functions dir + /* -> api redirect + CORS
  netlify/functions/api.js  # standalone handler (no dependency on this lib)
```

### 3. Deploy to Netlify

```sh
cd deploy
NETLIFY_AUTH_TOKEN=<token> netlify deploy --build --prod
# or via the HQ Factory desktop app
```

Your public server is live — every route JSON-serializable and CORS-enabled
(`access-control-allow-origin: *`), ready to be consumed by any client app.

## Route syntax

- **Shorthand**: `"/path": async (ctx) => ({ ... })` — GET route
- **Full**: `"/path": { method: "GET"|["GET","POST"], handler: async (ctx) => ... }`

## ctx fields

| field    | meaning                                   |
|----------|-------------------------------------------|
| `path`   | request path                              |
| `method` | HTTP method (uppercase)                   |
| `query`  | parsed query string parameters            |
| `headers`| request headers                           |
| `body`   | parsed JSON body (or raw string / null)   |
| `now`    | `Date` object                             |
| `iso`    | current time ISO-8601                     |
| `unix`   | current time Unix seconds                 |
| `utc`    | current time UTC string                   |
| `date`   | YYYY-MM-DD                                |
| `time`   | HH:MM:SS                                  |
| `event`  | raw Netlify event (also available)        |

## Rules & limitations

- Handlers **must be self-contained** (use only `ctx` + plain JS) — they are
  serialized into the exported function via `Function#toString()`.
- Routes are matched on **exact paths**; use query params for dynamic input.
- Non-existent paths → `404`; wrong method → `405`.

## Publishing for future projects

`lib/` is dependency-free (Node only). To reuse across other repos either:
- copy `lib/` into the project, or
- publish as an npm package and `require("hq-server")`.