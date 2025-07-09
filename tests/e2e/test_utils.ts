import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');
const VITE_PORT = 5173;

export const killProcessOnPort = async (port: number) => {
  const command = process.platform === 'win32'
    ? `powershell -Command "Get-NetTCPConnection -LocalPort ${port} | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`
    : `lsof -ti:${port} | xargs kill -9`;
  try {
    await execPromise(command);
    console.log(`✅ Killed process on port ${port}`);
  } catch (error: any) {
    console.error(`❌ Failed to kill process on port ${port}:`);
    console.log("不用太担心！！也许是根本就没有5173这个端口的进程（狗头")
  }
}; 

export const startVite = async (): Promise<ReturnType<typeof spawn>> => {
  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    shell: true,
  });
  console.log('\x1b[32m%s\x1b[0m', 'Vite dev server started');
  await new Promise(resolve => setTimeout(resolve, 5000)); // 简单等 5 秒
  return viteProcess;
};

export const launchElectron = async (): Promise<ElectronApplication> => {
  const app = await electron.launch({
    args: [path.join(projectRoot, 'src/main/main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });
  console.log('\x1b[32m%s\x1b[0m', 'Electron app launched');
  return app;
};

export const getMainPage = async (app: ElectronApplication): Promise<Page> => {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return page;
};

// ✅ 一键启动所有东西
export const setUpEverything = async (): Promise<{
  viteProcess: ReturnType<typeof spawn>,
  electronApp: ElectronApplication,
  page: Page
}> => {
  // await killProcessOnPort(VITE_PORT);
  const viteProcess = await startVite();
  const electronApp = await launchElectron();
  const page = await getMainPage(electronApp);
  return { viteProcess, electronApp, page };
};

// ✅ 一键关闭所有东西
export const closeEverything = async (electronApp: ElectronApplication) => {
  await electronApp.close();
  await killProcessOnPort(VITE_PORT);
  console.log('\x1b[32m%s\x1b[0m', 'Cleaned up everything');
};
