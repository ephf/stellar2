import fs from "fs";
import path from "path";

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
