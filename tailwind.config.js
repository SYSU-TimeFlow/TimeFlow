module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    'dark:text-[var(--heading-color)]',
    'dark:bg-[var(--search-bg)]',
    'dark:border-[var(--search-border)]',
    'dark:text-[var(--text-primary)]',
    'dark:text-[var(--text-tertiary)]',
  ],
  theme: {
    extend: {
      // 你的自定义主题
    },
  },
  plugins: [],
}