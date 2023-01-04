import "../prototypes.js";
import { Element } from "../../jsx/backend.js";
import { handleAPI } from "./api.js";
import { handleClientSideRender } from "./csr.js";
import { handleServerSideRender } from "./ssr.js";
import { handle404 } from "./404.js";

export function handleRequest(pages, html) {
  return (req, res) => {
    res.headers({ "Cache-Control": "no-cache" });
    const [url, rawquery] = req.url.split("#")[0].split("?");
    req.query = Object.fromEntries(new URLSearchParams(rawquery ?? ""));
    res.state = {};

    const page = pages[url];
    if (!page) return handle404(req, res);

    if (page.type == "api") return handleAPI(page, req, res);
    const result = page.ping(req, res);

    if (typeof result == "function")
      return handleClientSideRender(html, page, result, req, res);
    if (result instanceof Element)
      return handleServerSideRender(html, page, result, req, res);
  };
}
