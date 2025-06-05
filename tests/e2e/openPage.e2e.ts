import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('openPages', async () => {
  // 启动 Vite 开发服务器
  const { page, electronApp } = await setUpEverything();

  try {
    // ================================================
    // |以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ================================================
    await page.goto('http://localhost:5173/#/');
    await page.getByRole('button', { name: '' }).click();
    // 打开设置页面
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
    await page.getByRole('combobox').first().selectOption('light');
    await expect(page.locator('#app')).toContainText('亮');
    await page.getByRole('combobox').first().selectOption('dark');
    await expect(page.locator('#app')).toContainText('暗');
    await page.getByRole('combobox').nth(1).selectOption('small');
    await expect(page.locator('#app')).toContainText('小');
    await page.getByRole('combobox').nth(1).selectOption('medium');
    await expect(page.locator('#app')).toContainText('中');
    await page.getByRole('combobox').nth(1).selectOption('large');
    await expect(page.locator('#app')).toContainText('大');
    await page.getByRole('combobox').nth(1).selectOption('medium');
    await page.getByRole('button', { name: '重置默认' }).click();
    await expect(page.locator('#app')).toContainText('亮');
    await expect(page.locator('#app')).toContainText('中');
    await page.getByTitle('关闭', { exact: true }).click();

    // 打开分类页面
    await page.getByTitle('添加新分类', { exact: true }).click();
    await expect(page.getByRole('heading', { name: '添加分类' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();

    // 打开事件页面
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' 周' }).click();
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' 日' }).click();
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' 待办' }).click();
    await page.getByRole('button', { name: '+ Add Event' }).click();
    await expect(page.getByRole('heading', { name: 'New Todo' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('heading', { name: 'TimeFlow' }).click();
    await expect(page.getByText('Add Event View 月周日待办')).not.toBeVisible();
    await page.getByRole('heading', { name: 'TimeFlow' }).click();
    await expect(page.getByText('Add Event View 月周日待办')).toBeVisible();

    // 模拟按下？打开快捷键帮助页面
    await page.keyboard.press('?');
    await expect(page.getByRole('heading', { name: ' TimeFlow Keyboard Shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: ' TimeFlow Keyboard Shortcuts' })).not.toBeVisible();


    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});