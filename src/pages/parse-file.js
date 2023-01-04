import fs from "fs";
import path from "path";
import * as make from "./make.js";

export function parseFile(dir) {
  const srcDir = "file://" + process.cwd();
  return async (file) => {
    const page = path.join(dir, file);
    const read = path.join("pages", dir, file);

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

    if (read.match("\\\\api\\\\")) {
      await make.api(srcDir, read, url);
      return;
    }

    if (ext == ".jsx") {
      await make.jsx(srcDir, read, url, dir);
      return;
    }
  };
}
