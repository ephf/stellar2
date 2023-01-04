import { createServer } from "http";
import getPages from "./pages.js";
import fs from "fs";

import { preRender } from "./server/frontend/pre-render.js";
import { handleUpgrade } from "./server/handlers/upgrade.js";
import { handleRequest } from "./server/handlers/request.js";
import { createElement } from "./jsx/frontend.js";

async function listen({ port = 80, testing = false }) {
  const pages = await getPages("");
  const html = fs.readFileSync("index.html", "utf-8").replace(
    "</head>",
    `<script>
        window._stellarFunctionRegistry={};
        window.jsx={
          _functionRegistry: [],
          createElement: ${createElement.toString()}
        };
        (${preRender.toString()})();
        ${
          testing
            ? 'new WebSocket("ws://localhost/stellartesting").onmessage=({data})=>data=="reload"&&location.reload();'
            : ""
        }
      </script></head>`
  );

  const server = createServer(handleRequest(pages, html));

  const pings = [];
  server.on("upgrade", handleUpgrade(pages, pings));

  server.pages = pages;
  server.pings = pings;
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

export default listen;
