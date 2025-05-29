import { test, expect } from "@playwright/test";
import { _electron as electron } from "playwright";

(async () => {
  const browser = await electron.launch({
    headless: false
  });
  const context = await browser.firstWindow();
  const page = await context.newPage();
  await page.goto('devtools://devtools/bundled/devtools_app.html?remoteBase=https://chrome-devtools-frontend.appspot.com/serve_file/@c2a8207ba0335e97eae4aaa7d5c35e601ae55ca0/&can_dock=true&toolbarColor=rgba(223,223,223,1)&textColor=rgba(0,0,0,1)&experiments=true');
  const page1 = await context.newPage();
  await page1.goto('http://localhost:5173/');
  await page1.locator('div').filter({ hasText: /^7$/ }).first().click();
  await page1.getByRole('textbox', { name: 'Event title' }).click();
  await page1.getByRole('textbox', { name: 'Event title' }).fill('12345');
  await page1.getByRole('textbox', { name: 'Event title' }).press('Enter');
  await page1.getByRole('button', { name: 'Save' }).click();
  await page1.getByRole('button', { name: ' 周' }).click();
  await page1.getByRole('button', { name: ' 日' }).click();
  await page1.getByRole('button', { name: ' To-Do' }).click();
  await page1.getByRole('button', { name: ' 日' }).click();
  await page1.getByRole('button', { name: ' 周' }).click();
  await page1.getByRole('button', { name: ' 月' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();