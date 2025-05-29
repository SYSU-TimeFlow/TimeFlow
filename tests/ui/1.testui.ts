import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Electron app test', async () => {
  // 启动 Vite 开发服务器
  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../..'), // 指向项目根目录
    shell: true,
    stdio: 'inherit'
  });

  console.log('\x1b[32m%s\x1b[0m', 'Vite dev server started successfully');

  // 等待 Vite 服务器启动（简单实现，实际可能需要更复杂的检测）
  await new Promise(resolve => setTimeout(resolve, 5000));
  // 启动 Electron 应用 - 这部分保持不变
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '../../main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  
  // 获取主窗口 - 这部分保持不变
  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');


  console.log('\x1b[32m%s\x1b[0m', 'Electron app launched successfully');

  try {
    // ===============================================
    // 以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ===============================================

    await page.goto('http://localhost:5173/#/');
    await page.locator('div').filter({ hasText: /^5$/ }).first().click();
    await page.getByRole('textbox', { name: 'Event title' }).click();
    await page.getByRole('textbox', { name: 'Event title' }).fill('playwright测试');
    await page.locator('div').filter({ hasText: /^Category$/ }).locator('div').click();
    await page.getByRole('textbox', { name: 'Event description' }).click();
    await page.getByRole('textbox', { name: 'Event description' }).fill('测试描述');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('上午09:00 - 上午10:00playwright测试')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('playwright测试');
    
    await page.getByText('上午09:00 - 上午10:00playwright测试').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    await expect(page.getByText('上午09:00 - 上午10:00playwright测试')).not.toBeVisible();
    await expect(page.getByRole('main')).not.toContainText('playwright测试');
  
    // ===============================================
    // 替换部分结束                                   |
    // ===============================================
  } finally {
      // 关闭应用 - 这部分保持不变
      await electronApp.close();
      // 关闭 Vite 开发服务器
      viteProcess.kill();
      console.log('\x1b[32m%s\x1b[0m', 'Electron app closed successfully');
    }  

});