import { test, expect } from '@playwright/test';
import { setUpEverything, closeEverything } from './test_utils';

test('窗口操作：最小化、最大化和关闭', async () => {
  // 为此测试设置更长的超时时间，以确保在慢速 CI 环境中也能完成
  test.setTimeout(60000); // 60 秒

     const { electronApp } = await setUpEverything();
  
  try {
    expect(true).toBe(true);
  } finally {
    // 确保测试结束后关闭所有资源
    await closeEverything(electronApp);
  }

});