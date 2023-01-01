import { IncomingMessage, ServerResponse, createServer } from "http";
import { createHash } from "crypto";
import { Element } from "./jsx/backend.js";
import path from "path";
import getPages from "./pages.js";
import fs from "fs";
import EventEmitter from "events";

Object.assign(IncomingMessage.prototype, {
  async data() {
    return new Promise((resolve) => {
      this.on("data", (data) => resolve(data));
    });
  },
  async json() {
    return JSON.stringify((await this.data()).toString());
  },
  async text() {
    return (await this.data()).toString();
  },
});

const WEBSOCKET_SYMBOL = Symbol("websocket");

Object.assign(ServerResponse.prototype, {
  addedHeaders: {},
  setStatus: 200,
  status(status) {
    this.setStatus = status;
    return this;
  },
  headers(headers) {
    Object.assign(this.addedHeaders, headers);
    return this;
  },
  send(text) {
    this.writeHead(this.setStatus, this.addedHeaders);
    this.end(text);
  },
  json(json) {
    this.headers({ "Content-Type": "application/json" }).send(
      JSON.stringify(json)
    );
  },
  html(html) {
    this.headers({ "Content-Type": "text/html" }).send(html);
  },
  ws(listener) {
    return Object.assign(WEBSOCKET_SYMBOL, { listener });
  },
});

async function listen({ port = 80 } = {}) {
  const stack = new Error().stack;
  const filepath = stack.match(
    /(?<=^    at )file:\/\/\/\w:\/.+?(?=:[0-9]+:[0-9]+)/gm
  )[0];
  const srcDir = path.dirname(filepath);
  const pages = await getPages("", srcDir);

  const html = fs.readFileSync("index.html", "utf-8").replace(
    "</head>",
    `<script>window._stellarFunctionRegistry={};window.jsx={_functionRegistry:[],createElement:function ${jsx.createElement.toString()}};\n(${(() => {
      let oldhref = document.location.href;
      const handleNewContent = (content) => {
        const root = document.querySelector("#root");

        document.querySelector("#stellarcsr")?.remove();
        document.querySelector("#stellarexports")?.remove();

        if (content.type == "csr") {
          root.innerHTML = "";
          document.head.append(
            jsx.createElement(
              "script",
              { id: "stellarexports" },
              content.exports
            )
          );
          document.body.append(
            jsx.createElement("script", { id: "stellarcsr" }, content.script)
          );
        }

        if (content.type == "ssr") {
          document.head.append(
            jsx.createElement(
              "script",
              { id: "stellarexports" },
              content.functions
            )
          );
          root.innerHTML = content.html;
        }
      };

      window.onpopstate = () => {
        if (document.location.href != oldhref) {
          oldhref = document.location.href;
          fetch(document.location.href, {
            headers: {
              "X-Stellar-Prerender": "true",
            },
          })
            .then((res) => res.json())
            .then(handleNewContent);
        }
      };

      new MutationObserver((mutations) => {
        mutations.forEach(({ addedNodes }) =>
          addedNodes.forEach((node) => {
            if (node.nodeName == "A") {
              const href = node.outerHTML.match(/(?<=href=").+?(?=")/)?.[0];
              if (!href || href.match(/^https?:\/\//)) return;
              node.awaitData = fetch(href, {
                headers: {
                  "X-Stellar-Prerender": "true",
                },
              }).then((res) => res.json());
              node.onclick = async (ev) => {
                ev.preventDefault();
                const content = await node.awaitData;
                handleNewContent(content);
                window.history.pushState(null, "", node.href);
                oldhref = document.location.href;
              };
            }
          })
        );
      }).observe(document, { childList: true, subtree: true });
    }).toString()})()</script></head>`
  );

  const server = createServer((req, res) => {
    res.headers({ "Cache-Control": "no-cache" });

    const [url, rawquery] = req.url.split("#")[0].split("?");
    req.query = Object.fromEntries(new URLSearchParams(rawquery ?? ""));
    res.state = {};

    const page = pages[url];
    if (!page) {
      res.status(404).send(`Cannot ${req.method} ${req.url}`);
      return;
    }

    if (page.type == "api") {
      if (page.default) {
        page.default(req, res);
        return;
      }

      const ping = page[req.method];
      if (!ping) {
        res.status(404).send(`Cannot ${req.method} ${req.url}`);
        return;
      }
      ping(req, res);
      return;
    }

    const result = page.ping(req, res);
    let content = "";

    if (req.headers["x-stellar-prerender"] == "true") {
      if (typeof result == "function")
        content = {
          type: "csr",
          script: `document.querySelector("#root").append((${result.toString()})(${JSON.stringify(
            res.state
          )}))`,
          exports: page.exports,
        };

      if (result instanceof Element)
        content = {
          type: "ssr",
          functions: result.functions + page.exports,
          html: result.html,
        };

      res.status(200).json(content);
      return;
    }

    if (typeof result == "function")
      content = html
        .replace(
          "</body>",
          `<script id="stellarcsr">document.querySelector("#root").append((${result.toString()})(${JSON.stringify(
            res.state
          )}))</script></body>`
        )
        .replace(
          "</head>",
          `<script id="stellarexports">${page.exports}</script></head>`
        );

    if (result instanceof Element)
      content = html
        .replace(
          /(<div(?:.|[\r\n])*?id="root"(?:.|[\r\n])*?>)<\/div>/,
          `$1${result.html}</div>`
        )
        .replace(
          "</head>",
          `<script id="stellarexports">${
            result.functions + page.exports
          }</script></head>`
        );

    res.status(200).html(content);
  });

  server.on("upgrade", (req, socket) => {
    const [url, rawquery] = req.url.split("#")[0].split("?");
    req.query = Object.fromEntries(new URLSearchParams(rawquery ?? ""));

    const page = pages[url];
    if (!page?.WS) return;

    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${createHash("sha1")
          .update(
            req.headers["sec-websocket-key"] +
              "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
          )
          .digest("base64")}\r\n\r\n`
    );
    const customSocket = Object.setPrototypeOf(new EventEmitter(), socket);
    socket.on("data", (data) => {
      if (data[0] == 0x88) {
        customSocket.emit("close");
        return;
      }
      const xor = data.slice(2, 6);
      data = data.slice(6).map((byte, i) => byte ^ xor[i % 4]);
      customSocket.emit("data", data);
    });
    customSocket.write = (text) => {
      socket.write(Buffer.from([0x81, text.length, ...Buffer.from(text)]));
    };

    page.WS(customSocket, req);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

export default listen;
