import fs from "fs";
import path from "path";

import "./pages/rmout.js";
import { parseFile } from "./pages/parse-file.js";

export const pages = [];

async function getPages(dir = "") {
  await Promise.all(
    fs.readdirSync(path.join("pages", dir)).map(parseFile(dir))
  );
  return pages;
}

export default getPages;
