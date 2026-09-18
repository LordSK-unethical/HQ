# HQ — quick public servers

Create and deploy **public JSON servers on Netlify in seconds**, then reuse them
from any future project.

## Repo layout

| path | what it is |
|------|-----------|
| `lib/` | **hq-server** — reusable library. Define routes → run locally, or export a standalone Netlify serverless function. See `lib/README.md`. |
| `desktop/` | **HQ Factory** — Electron app: edit routes, preview locally, export & deploy to Netlify with a token. |
| `netlify/`, `public/` | The live demo site (<https://hq-web-service.netlify.app>) used as a test client/server. |

## Quick start

### 1. Desktop app (HQ Factory)

```sh
cd desktop && npm install && npm start
```

Tabs:
- **Routes** — write your `hqfile` (route definitions)
- **Preview** — run a local dev server, list + call routes
- **Publish** — export the standalone Netlify project, then deploy with a
  Netlify personal access token (dashboard → User settings → Applications)
- **Monitor** — hit any deployed server and inspect the response

### 2. Library in your own projects

```sh
npm link          # inside HQ/lib  (or copy lib/ into your project)
npm install ./HQ/lib
```

```js
const { HqServer } = require("hq-server"); // or require("./lib")

const server = new HqServer({
  name: "my-api",
  routes: {
    "/time": async (ctx) => ({ iso: ctx.iso, unix: ctx.unix }),
    "/echo": {
      method: ["POST"],
      handler: async (ctx) => ({ youSent: ctx.body }),
    },
  },
});

server.listen(3000);                           // local dev
server.exportNetlify("./deploy");              // standalone netlify project
// then: cd deploy && netlify deploy --build --prod
```

Deployed servers are JSON + CORS-enabled (`access-control-allow-origin: *`), so
any web/mobile/desktop client can consume them directly.

## Netlify deploy

```sh
cd deploy
NETLIFY_AUTH_TOKEN=<token> netlify deploy --build --prod
```

> Tip: your existing Netlify site is connected to this repo via git — use the
> **Publish** tab in HQ Factory, or push a generated server folder to a repo
> connected to Netlify for auto-deploys.