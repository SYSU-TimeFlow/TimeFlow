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
    const startButton = page.getByRole('button', { name: '开始使用' });
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.getByRole('button', { name: '' }).click();
    // 打开设置页面
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('combobox').first().selectOption('light');
    await expect(page.locator('#app')).toContainText('Light');
    await page.getByRole('combobox').first().selectOption('dark');
    await expect(page.locator('#app')).toContainText('Dark');
    await page.getByRole('combobox').nth(1).selectOption('small');
    await expect(page.locator('#app')).toContainText('Small');
    await page.getByRole('combobox').nth(1).selectOption('medium');
    await expect(page.locator('#app')).toContainText('Medium');
    await page.getByRole('combobox').nth(1).selectOption('large');
    await expect(page.locator('#app')).toContainText('Large');
    await page.getByRole('combobox').nth(1).selectOption('medium');
    await page.getByRole('button', { name: 'Reset to Default' }).click();
    await expect(page.locator('#app')).toContainText('Light');
    await expect(page.locator('#app')).toContainText('Medium');
    await page.getByTitle('Close', { exact: true }).click();

    // 打开分类页面
    await page.getByTitle('添加新分类', { exact: true }).click();
    await expect(page.getByRole('heading', { name: '添加分类' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();

    // 打开事件页面
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' Week' }).click();
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' Day' }).click();
    await page.getByText('Add Event').click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('button', { name: ' ToDo' }).click();
    await page.getByRole('button', { name: '+ Add Event' }).click();
    await expect(page.getByRole('heading', { name: 'New Todo' })).toBeVisible();
    await page.getByRole('button', { name: '' }).nth(1).click();
    await page.getByRole('heading', { name: 'TimeFlow' }).click();
    await expect(page.getByText('Add Event View MonthWeekDayToDo')).not.toBeVisible();
    await page.getByRole('heading', { name: 'TimeFlow' }).click();
    await expect(page.getByText('Add Event View MonthWeekDayToDo')).toBeVisible();

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