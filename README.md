# TimeFlow 时间流

一个现代化的桌面日历应用，基于 Electron + Vue 3 + TypeScript 构建，提供直观的时间管理和事件规划功能。

## 📝 项目简介

TimeFlow 是一个功能丰富的桌面日历应用，旨在帮助用户高效管理时间和安排日程。它结合了传统日历的直观性和现代待办事项管理的灵活性，为用户提供了一个统一的时间管理平台。

## ✨ 核心功能

### 📅 多视图日历
- **月视图**: 提供整月概览，快速查看每日事件
- **周视图**: 详细的时间轴展示，支持精确的时间安排
- **日视图**: 专注于单日计划，支持小时级别的事件管理
- **待办视图**: 专门的待办事项管理界面

### 📋 事件管理
- **创建事件**: 支持标题、时间、描述、分类等详细信息
- **编辑事件**: 灵活的事件编辑功能，支持拖拽调整时间
- **删除事件**: 简单的事件删除操作
- **全天事件**: 支持全天事件的创建和管理
- **事件分类**: 多种颜色分类，便于事件归类和识别

### ✅ 待办事项
- **待办管理**: 创建、编辑、删除待办事项
- **完成状态**: 支持待办事项的完成状态切换
- **截止时间**: 可选的截止时间设置
- **分类过滤**: 支持按状态（全部、进行中、已完成）筛选
- **"我的一天"**: 专门的今日待办事项视图

### 🎨 个性化设置
- **主题切换**: 支持浅色和深色主题
- **字体大小**: 可调节的字体大小设置
- **通知系统**: 事件和待办事项的提醒通知
- **时间格式**: 支持12小时制和24小时制切换
- **农历显示**: 可选的农历日期显示
- **周起始日**: 自定义一周的开始日期

### 🔍 搜索与导航
- **事件搜索**: 快速搜索历史事件
- **命令模式**: 通过键盘快捷键执行快速操作
- **快捷键支持**: 丰富的键盘快捷键
- **今日跳转**: 快速跳转到今天的日期

## 🛠️ 技术栈

### 前端技术
- **Vue 3**: 现代化的 JavaScript 框架
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速的前端构建工具
- **Pinia**: Vue 3 状态管理库
- **Vue Router**: 客户端路由管理
- **Tailwind CSS**: 实用优先的 CSS 框架

### 桌面应用
- **Electron**: 跨平台桌面应用开发框架
- **electron-builder**: 应用打包和分发工具
- **electron-win-state**: 窗口状态管理

### 数据存储
- **better-sqlite3**: 高性能的 SQLite 数据库
- **本地存储**: 所有数据本地存储，保护隐私

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Playwright**: 端到端测试框架
- **Vitest**: 单元测试框架

## 📦 项目结构

```
TimeFlow/
├── src/                      # 源代码目录
│   ├── components/          # Vue 组件
│   │   ├── main/           # 主要视图组件
│   │   │   ├── CalendarMain.vue
│   │   │   ├── MonthView.vue
│   │   │   ├── WeekView.vue
│   │   │   ├── DayView.vue
│   │   │   └── ToDoView.vue
│   │   ├── pages/          # 模态框页面组件
│   │   │   ├── EventPage.vue
│   │   │   ├── ToDoPage.vue
│   │   │   ├── CategoryPage.vue
│   │   │   └── SettingPage.vue
│   │   └── sidebar/        # 侧边栏组件
│   ├── stores/             # Pinia 状态管理
│   │   ├── event.ts        # 事件管理
│   │   ├── setting.ts      # 设置管理
│   │   └── ui/            # UI 状态管理
│   ├── views/              # 页面视图
│   ├── utils/              # 工具函数
│   ├── const/              # 常量定义
│   └── styles/             # 样式文件
├── tests/                   # 测试文件
│   ├── e2e/                # 端到端测试
│   └── unit/               # 单元测试
├── assets/                 # 静态资源
├── build/                  # 构建输出
├── main.js                 # Electron 主进程
├── preload.js              # Electron 预加载脚本
├── database.js             # 数据库管理
└── ipcHandlers.js          # IPC 通信处理
```

## 🚀 快速开始

### 环境要求
- Node.js 16.0 或更高版本
- npm 或 pnpm

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 启动 Electron 开发模式
npm run start
```

### 构建应用
```bash
# 构建前端资源
npm run build

# 构建 Electron 应用
npm run electron:build
```

## 🧪 测试

### 单元测试
```bash
npm run test:unit
```

### 端到端测试
```bash
npm run test:e2e
```

### 运行所有测试
```bash
npm run test
```

## ⌨️ 快捷键

- `Ctrl/Cmd + N`: 新建事件
- `Ctrl/Cmd + F`: 搜索事件
- `:`: 进入命令模式
- `Space`: 切换侧边栏
- `1`: 切换到月视图
- `2`: 切换到周视图
- `3`: 切换到日视图
- `4`: 切换到待办视图
- `?`: 显示帮助信息
- `Ctrl/Cmd + T`: 跳转到今天

## 🎯 主要特性

### 事件类型
- **日历事件**: 传统的日历事件，具有明确的开始和结束时间
- **待办事项**: 任务导向的事项，可选截止时间
- **混合事件**: 既是日历事件又是待办事项，支持完成状态切换

### 数据存储
- 所有数据本地存储，保护用户隐私
- 使用 SQLite 数据库，高效稳定
- 支持数据备份和恢复

### 用户体验
- 现代化的界面设计
- 流畅的动画效果
- 响应式布局
- 无边框窗口设计
- 系统托盘集成

## 🔧 配置说明

### 主题配置
应用支持浅色和深色两种主题，会根据系统设置自动切换，也可以手动设置。

### 通知设置
- 事件开始前15分钟提醒
- 待办事项截止前30分钟提醒
- 可在设置中开关通知功能

### 数据位置
- Windows: `%APPDATA%/TimeFlow/timeflow.db`
- macOS: `~/Library/Application Support/TimeFlow/timeflow.db`
- Linux: `~/.config/TimeFlow/timeflow.db`

## 📱 平台支持

- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux (Ubuntu, Fedora, etc.)

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。详情请查看 [LICENSE](LICENSE) 文件。

## 👥 致谢

感谢所有为这个项目做出贡献的开发者和用户！

## 📞 联系我们

如果您有任何问题或建议，请通过以下方式联系我们：

- 提交 [Issue](https://github.com/yourusername/TimeFlow/issues)
- 发送邮件至：your.email@example.com

---

**TimeFlow** - 让时间管理更加优雅高效！ ⏰✨
