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
  console.log(`🔍 Killing process on port ${port}...`);
  const platform = process.platform;

  let command;

  if (platform === 'win32') {
    // Windows 使用 PowerShell 查找并终止进程
    command = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`;
  } else if (platform === 'darwin' || platform === 'linux') {
    // macOS ('darwin') 和 Ubuntu/Linux 使用 lsof 和 kill
    command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
  } else {
    throw new Error(`🚫 Unsupported platform: ${platform}`);
  }

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(`📜 Output: ${stdout}`);
    if (stderr) console.error(`⚠️ Warning: ${stderr}`);
    console.log(`✅ Successfully killed process on port ${port}`);
  } catch (error) {
    if (error.code === 1 && (platform === 'darwin' || platform === 'linux')) {
      console.log(`ℹ️ No process found on port ${port} or already killed`);
    } else {
      console.error(`❌ Failed to kill process on port ${port}:`, error.message);
    }
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
