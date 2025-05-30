import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('displayTodoInCalendar', async () => {
  // 启动 Vite 开发服务器
  const { page, electronApp } = await setUpEverything();

  try {
    // ================================================
    // |以下是你可以替换的部分 - 每次录制新测试后替换这里|
    // ================================================

    // 该测试是在todo列表中添加一个事件，然后在日历中查看它是否可见

    await page.goto('http://localhost:5173/#/');
    await page.getByRole('button', { name: 'To-Do' }).click();
    await page.getByRole('button', { name: '+ Add Event' }).click();
    await page.getByRole('textbox', { name: 'Enter task title' }).click();
    await page.getByRole('textbox', { name: 'Enter task title' }).fill('EventTypeBoth');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('EventTypeBoth')).toBeVisible();
    await page.getByRole('button', { name: '月' }).click();
    await expect(page.getByText('EventTypeBoth')).toBeVisible();
    await page.getByRole('button', { name: 'To-Do' }).click();
    await page.getByRole('button', { name: '' }).click();

    // dark mode
    
  
    // ===============================================
    // |替换部分结束                                  |
    // ===============================================
  } finally {
    await closeEverything(electronApp);
  }
});
