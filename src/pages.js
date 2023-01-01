import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import "just-jsx";

const pages = [];

if (!fs.existsSync("out")) fs.mkdirSync("out");
else {
  (function rmDir(dir) {
    fs.readdirSync(dir).forEach((file) => {
      file = path.join(dir, file);
      if (fs.lstatSync(file).isDirectory()) {
        rmDir(file);
        return;
      }

      fs.unlinkSync(file);
    });
    fs.rmdirSync(dir);
  })("out");
  fs.mkdirSync("out");
}

async function getPages(dir = "", srcDir) {
  const dirread = path.join("pages", dir);
  await Promise.all(
    fs.readdirSync(dirread).map(async (file) => {
      const page = path.join(dir, file);
      const read = path.join(dirread, file);
      const api = !!read.match("\\\\api\\\\");

      if (fs.lstatSync(read).isDirectory()) {
        if (!fs.existsSync(path.join("out", page)))
          fs.mkdirSync(path.join("out", page));
        getPages(page, srcDir);
        return;
      }

      const ext = path.extname(file);
      let url = "/" + page.replace(ext, "").replace(/\\/g, "/");
      if (url.endsWith("index")) url = url.replace(/index$/, "");
      url = url.replace(/(.)\/$/, "$1");

      if (api) {
        const apiModule = await import(path.join(srcDir, read));
        pages[url] = {
          ...apiModule,
          type: "api",
        };
        return;
      }

      if (ext == ".jsx") {
        const jsxContent = fs.readFileSync(read, "utf-8");
        const jsContent =
          'import jsx from "stellar2/src/jsx/backend.js";\n' +
          jsx.parse(jsxContent);
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
    })
  );
  return pages;
}

export default getPages;
