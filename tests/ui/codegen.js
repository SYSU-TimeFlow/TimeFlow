import { _electron as electron } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import electronPath from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, "../../main.js")],
    executablePath: electronPath,
  });
  const window = await electronApp.firstWindow();
  await window.pause();
  console.log(await window.title());
  window.on("console", console.log);
})();
