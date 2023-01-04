import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

import { pages } from "../pages.js";
import { parse } from "../jsx/parse.js";

export async function api(srcDir, read, url) {
  const apiModule = await import(path.join(srcDir, read));
  pages[url] = {
    ...apiModule,
    type: "api",
  };
}

export async function jsx(srcDir, read, url, dir) {
  const jsxContent = fs.readFileSync(read, "utf-8");
  const jsContent =
    'import jsx from "stellarjs/src/jsx/backend.js";\n' + parse(jsxContent);
  const out = path.join("out", dir, randomUUID() + ".js");

  fs.writeFileSync(out, jsContent);
  const pageModule = await import(path.join(srcDir, out));

  let exports = "";
  Object.entries(pageModule).forEach(
    ([key, value]) =>
      key == "default" ||
      (exports +=
        typeof value == "function"
          ? value.toString() + "\n"
          : `var ${key} = ${JSON.stringify(value)};\n`)
  );

  pages[url] = {
    type: "page",
    out,
    exports,
    ping: pageModule.default,
  };
}
