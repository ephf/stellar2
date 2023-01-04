#!node
import listen from "./index.js";
import fs from "fs";
import path from "path";
import { parseFile } from "./pages/parse-file.js";
import { execSync } from "child_process";

let [, , port] = process.argv;
if (!port || isNaN(Number(port))) port = 80;

if (process.argv[2] == "init") {
  fs.mkdirSync("pages");
  fs.writeFileSync(
    "index.html",
    '<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n<div id="root"></div>\n</body>\n</html>'
  );
  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      {
        type: "module",
        scripts: {
          test: "star --test",
          start: "star",
        },
      },
      null,
      2
    )
  );
  execSync("npm install stellarjsx");
  process.exit();
}

console.log("⭐ Starting Your Server...");

listen({ port, testing: true }).then(({ pages, pings }) => {
  const routes = Object.keys(pages).length;

  console.clear();
  process.stdout.cursorTo(2, 1);
  process.stdout.write(
    "\x1b[32m" +
      "🌠 Server is Running at " +
      "\x1b[4m" +
      `http://localhost:${port}` +
      "\x1b[0m"
  );
  process.stdout.cursorTo(5, 2);
  process.stdout.write(
    "\x1b[34m" +
      `↳ Watching ${routes} Route${routes == 1 ? "" : "s"}... ` +
      "\x1b[0m"
  );

  if (process.argv.includes("--test")) {
    process.stdout.write("\x1b[38;2;90;90;90m" + " <Test Mode/>" + "\x1b[0m");

    let change = false;
    (function watchRecursive(dir) {
      const readdir = path.join("pages", dir);
      fs.readdirSync(readdir).forEach((file) => {
        if (fs.lstatSync(path.join(readdir, file)).isDirectory()) {
          watchRecursive(path.join(dir, file));
        }
      });
      fs.watch(readdir, async (type, file) => {
        if (change) return;

        change = true;
        setTimeout(() => (change = false), 200);

        const read = path.join(readdir, file);
        if (type == "rename") return;
        if (fs.lstatSync(read).isDirectory()) return;

        await parseFile(dir)(file);
        console.log(`✨ Handled Changes to ${read} --- Reloading...`);
        pings.forEach((ping) => ping());
        pings.length = 0;
      });
    })("");
  }

  process.stdout.cursorTo(0, 4);
});
