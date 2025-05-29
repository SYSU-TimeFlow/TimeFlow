import { _electron as electron } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import electronPath from "electron";
import { spawn, exec } from "child_process";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);

const killProcessOnPort = async (port) => {
  console.log(`Killing process on port ${port}...`);
  const platform = process.platform;

  const command = platform === 'win32'
    ? `powershell -Command "Get-NetTCPConnection -LocalPort ${port} | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`
    : `lsof -ti:${port} | xargs kill -9`;


  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(`✅ Killed process on port ${port}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error(`❌ Failed to kill process on port ${port}:`, error.message);
  }
};

(async () => {
  const viteProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, "../.."),
    shell: true,
  });

  console.log("\x1b[32m%s\x1b[0m", "Vite dev server starting...");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  let electronApp;
  try {
    electronApp = await electron.launch({
      args: [path.join(__dirname, "../../main.js")],
      executablePath: electronPath,
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    console.log("\x1b[32m%s\x1b[0m", "Electron app launched for Codegen.");

    await window.pause();
    console.log(await window.title());
    window.on("console", console.log);
  } finally {
    if (electronApp) {
      await electronApp.close();
      console.log("\x1b[32m%s\x1b[0m", "Electron app closed.");
    }
    await killProcessOnPort(5173);
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill();
      console.log("\x1b[32m%s\x1b[0m", "Vite dev server process killed.");
    }
  }
})();
