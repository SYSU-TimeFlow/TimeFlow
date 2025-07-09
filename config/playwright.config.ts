import { defineConfig, _electron as electron } from '@playwright/test'

export default defineConfig({
  webServer: {
    command: 'npm run dev', // 启动 Vite 开发服务器的命令
    url: 'http://localhost:5173', // Vite 开发服务器的 URL
    reuseExistingServer: !process.env.CI, // 在 CI 环境中不重用现有服务器，本地可以重用
    timeout: 10 * 1000, // 等待服务器启动的超时时间 (例如 10 秒)
    cwd: '../', // 指定在项目根目录下运行 npm run dev
  },
  projects: [
    {
      name: 'electron',
      use: {
        // 启动 Electron 应用
        launchOptions: {
          executablePath: '../node_modules/.bin/electron', // Electron 可执行文件路径
          args: ['./src/main/main.js'], // 显式指定 Electron 主进程入口
          headless: true, // 设置为 true 会无头模式运行
        },
      },
      testDir: '../tests', // 测试文件存放目录
      testMatch: '**/*.e2e.ts', // 匹配测试文件后缀
    },
  ],
  outputDir: '../tests/test-results', // 测试结果输出目录
})
