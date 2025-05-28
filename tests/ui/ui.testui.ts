import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { test, expect } from '@playwright/test';

let app: ElectronApplication | undefined;
let page: Page | undefined;

test.beforeAll(async () => {
  app = await electron.launch({ args: ['.'] });
  page = await app.firstWindow();
});

test.afterAll(async () => {
  if (app) {
    await app.close();
  }
});

test('ui test', async () => {
  expect(page).toBeDefined(); // Example usage of expect
});
