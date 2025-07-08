import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('min & max & close', async () => {
  // 启动 Vite 开发服务器
  const { page, electronApp } = await setUpEverything();

  try {
    // ================================================
    // |以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ================================================

    // 该测试用例的目的是测试最小化、最大化和关闭窗口的功能

    // 1. 最大化窗口
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.maximize();
    });

    // 验证窗口是否已最大化
    await expect.poll(async () => 
      await electronApp.evaluate(async ({ BrowserWindow }) => 
        BrowserWindow.getAllWindows()[0].isMaximized()
      )
    ).toBe(true);

    // 2. 恢复窗口
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.unmaximize();
    });

    // 验证窗口是否已恢复
    await expect.poll(async () => 
      await electronApp.evaluate(async ({ BrowserWindow }) => 
        !BrowserWindow.getAllWindows()[0].isMaximized()
      )
    ).toBe(true);

    // 3. 最小化窗口
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.minimize();
    });

    // 验证窗口是否已最小化
    await expect.poll(async () => 
      await electronApp.evaluate(async ({ BrowserWindow }) => 
        BrowserWindow.getAllWindows()[0].isMinimized()
      )
    ).toBe(true);
    
    // 4. 再次恢复窗口
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.restore();
    });

    // 验证窗口是否已恢复（不再最小化）
    await expect.poll(async () => 
      await electronApp.evaluate(async ({ BrowserWindow }) => 
        !BrowserWindow.getAllWindows()[0].isMinimized()
      )
    ).toBe(true);

    // 5. 关闭窗口
    // 修正：使用 Promise.all 来同时执行点击操作和等待事件，避免竞争条件
    await Promise.all([
      electronApp.waitForEvent('close'), // 修正：使用 'close' 事件来等待应用关闭
      page.getByRole('button', { name: '' }).click()    // 执行导致事件发生的操作
    ]);

    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});