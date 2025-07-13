/**
 * @description Vitest 测试配置文件
 * 配置测试环境和参数
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/build/**",
        "**/dist/**",
        "**/coverage/**",
        "**/src/main/main.js",
        "**/src/main/preload.js",
        "**/src/renderer/components/**",
        "**/src/renderer/views/**",
        "**/src/renderer/App.vue",
        "**/src/renderer/main.ts",
        "**/src/renderer/router/index.ts",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**/*", "node_modules/**/*"],
    testTimeout: 10000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
