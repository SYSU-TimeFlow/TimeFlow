import { test, expect } from "@playwright/test";
import { _electron } from "playwright";

test('App launches and quits', async () => {
  // This disables the global 30s timeout
  test.setTimeout(0);
  const app = await _electron.launch({
    args: ['main.js'],
  });
  const window = await app.firstWindow();
  expect(window).toBeDefined();
  console.log('\x1b[32m%s\x1b[0m', 'Electron launched successfully');
  await app.close();
  console.log('\x1b[32m%s\x1b[0m', 'Electron closed successfully');
});
