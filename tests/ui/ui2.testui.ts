import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

test('test', async () => {
  test.setTimeout(0);
  const app = await electron.launch({
    args: ["main.js"],
  });
  // const page = await context.newPage();
  // await page.goto('devtools://devtools/bundled/devtools_app.html?remoteBase=https://chrome-devtools-frontend.appspot.com/serve_file/@c2a8207ba0335e97eae4aaa7d5c35e601ae55ca0/&can_dock=true&toolbarColor=rgba(223,223,223,1)&textColor=rgba(0,0,0,1)&experiments=true');
  // const page1 = await context.newPage();
  // await page1.goto('http://localhost:5173/');
  // await page1.locator('div').filter({ hasText: /^7$/ }).first().click();
  // await page1.getByRole('textbox', { name: 'Event title' }).click();
  // await page1.getByRole('textbox', { name: 'Event title' }).fill('12345');
  // await page1.getByRole('textbox', { name: 'Event title' }).press('Enter');
  // await page1.getByRole('button', { name: 'Save' }).click();
  // await page1.getByRole('button', { name: '周' }).click();
  // await page1.getByRole('button', { name: '日' }).click();
  // await page1.getByRole('button', { name: 'To-Do' }).click();
  // await page1.getByRole('button', { name: '日' }).click();
  // await page1.getByRole('button', { name: '周' }).click();
  // await page1.getByRole('button', { name: '月' }).click();
  
  // // ---------------------
  // await context.close();
  // await app.close();
  
  const window = await app.firstWindow();
  expect(window).toBeDefined();

  console.log('\x1b[32m%s\x1b[0m', 'Electron launched successfully');

  // 等待窗口加载完成
  await window.waitForLoadState("domcontentloaded");

  // 访问页面元素，比如获取标题
  const title = await window.title();
  console.log("窗口标题:", title);

  await window.getByRole('button', { name: '日' }).click();
  console.log("Clicked on 日 button");

  await window.getByRole('button', { name: '周' }).click();
  console.log("Clicked on 周 button");

  await window.getByRole('button', { name: '月' }).click();
  console.log("Clicked on 月 button");

  await window.locator('div').filter({ hasText: /^7$/ }).first().click();
  console.log("Clicked on the day with text '7'");
  await window.getByRole('textbox', { name: 'Event title' }).click();
  console.log("Clicked on the Event title textbox");  
  await window.getByRole('textbox', { name: 'Event title' }).fill('12345');
  await window.getByRole('textbox', { name: 'Event title' }).press('Enter');
  await window.getByRole('button', { name: 'Save' }).click();
  expect(await window.getByRole('button', { name: 'Save' }).isVisible()).toBe(false);

  // 关闭 Electron 应用
  await app.close();
});
