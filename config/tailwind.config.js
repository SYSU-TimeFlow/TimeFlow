module.exports = {
  content: [
    "../index.html",
    "../src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '.dark-mode'], // 使用自定义的 dark-mode 类名
  theme: {
    extend: {
      // 你的自定义主题
    },
  },
  plugins: [],
}