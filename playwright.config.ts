import { defineConfig, _electron as electron } from '@playwright/test'

export default defineConfig({
  projects: [
    {
      name: 'electron',
      use: {
        // 启动 Electron 应用
        launchOptions: {
          executablePath: './node_modules/.bin/electron', // Electron 可执行文件路径
          args: ['.'], // 启动 Electron 时传入的参数，指向应用目录
          // 如果你有特定的窗口大小需求，可以在此设置
          // headless: false, // 设置为 true 会无头模式运行
        },
      },
      testDir: './tests', // 测试文件存放目录
      testMatch: '**/*.spec.ts', // 匹配测试文件后缀
    },
  ],
})
