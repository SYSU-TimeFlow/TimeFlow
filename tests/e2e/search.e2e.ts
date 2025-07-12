import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('search functionality', async () => {
  // 启动 Vite 开发服务器
  const { page, electronApp } = await setUpEverything();

  try {
    // ================================================
    // |以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ================================================

    // 该测试用例的目的是测试搜索功能
    await page.goto('http://localhost:5173/#/');
    const startButton = page.getByRole('button', { name: '开始使用' });
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    const skipGuideButton = page.getByRole('button', { name: '跳过引导' });
    if (await skipGuideButton.isVisible()) {
      await skipGuideButton.click();
    }

    await page.locator('div').filter({ hasText: /^15$/ }).first().click();
    await page.getByRole('textbox', { name: 'Event title' }).click();
    await page.getByRole('textbox', { name: 'Event title' }).fill('搜索');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Press / to search').click();
    await page.getByRole('textbox', { name: 'Search events...' }).fill('搜');
    await page.getByRole('listitem').getByText('搜索').click();
    await page.getByRole('button', { name: 'Delete' }).click();

    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});