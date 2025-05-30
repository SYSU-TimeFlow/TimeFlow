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
    // 获取窗口大小
    const initialSize = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
    // 打印初始窗口大小
    console.log('Initial window size:', initialSize);
    // 最大化
    await page.getByRole('button', { name: '' }).click();
    // 等待窗口大小变化
    await page.waitForTimeout(500); // 等待 1 秒钟以确保窗口大小变化
    const maxSize = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
    await expect(maxSize.width).toBeGreaterThan(initialSize.width);
    await expect(maxSize.height).toBeGreaterThan(initialSize.height);

    // 复原
    await page.getByRole('button', { name: '' }).click();

    // 等待窗口大小变化
    await page.waitForTimeout(500); // 等待 1 秒钟以确保窗口大小变化

    const returnSize = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });

    await expect(returnSize.width).not.toBe(maxSize.width);
    await expect(returnSize.height).not.toBe(maxSize.height);

    // 最小化
    await page.getByRole('button', { name: '' }).click();
    // 等待窗口最小化
    await page.waitForTimeout(500); // 等待 1 秒钟以确保窗口最小化
    // 是否最小化成功

    const isMinimized = await electronApp.evaluate(async ({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0];
        return win.isMinimized();
    });

    await expect(isMinimized).toBe(true);


    // 恢复窗口
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win.isMinimized()) {
        win.restore(); // 恢复窗口
      }
    });

    // 等待窗口恢复
    await page.waitForTimeout(500); // 等待 1 秒钟以确保窗口恢复

    // 检查窗口是否恢复成功
    const isRestored = await page.evaluate(() => {
      return !document.hidden; // 检查文档是否可见
    });
    await expect(isRestored).toBe(true);

    // 关闭窗口
    await page.getByRole('button', { name: '' }).click();
    // // 等待窗口关闭
    // // 这里使用了一个事件监听器来等待窗口关闭
    // await expect(electronApp.waitForEvent('close')).resolves.not.toThrow();


    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});