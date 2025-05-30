import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('left right today', async () => {
  // 启动 Vite 开发服务器
  const { page, electronApp } = await setUpEverything();

  try {
    // ================================================
    // |以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ================================================
    
    // 该测试用例的目的是测试左侧和右侧的今天按钮功能
    await page.goto('http://localhost:5173/#/');
    await page.locator('div').filter({ hasText: /^12$/ }).first().click();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' 日' }).click();
    await expect(page.locator('h2')).toContainText('12日');
    await page.getByRole('banner').getByRole('button', { name: '' }).click();
    await expect(page.locator('h2')).toContainText('11日');
    await page.getByRole('button', { name: '' }).click();
    await expect(page.locator('h2')).toContainText('12日');
    await page.getByRole('button', { name: 'Today' }).click();
    // 获取今日日期
    const today = new Date();
    const todayDate = today.getDate().toString().padStart(2, '0');
    await expect(page.locator('h2')).toContainText(`${todayDate}日`);

    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});