/**
 * @file preload.js
 * @description 预加载脚本，主进程在创建窗口时注入到渲染进程。通过 contextBridge 安全地暴露有限的主进程 API，防止渲染进程直接访问敏感 Node.js 或 Electron 对象，提升安全性。
 * 
 * 为什么这样做：
 * - 只暴露经过筛选的 API，防止前端页面越权访问主进程资源，降低安全风险。
 * - 通过 invoke/send/on 等方法，前端可安全地与主进程进行数据交互和窗口控制，保证功能灵活且可控。
 * - 支持应用数据、设置、通知、课程导入、自然语言处理、语音识别、日志等功能，便于前端统一调用，提升开发效率和代码可维护性。
 * - 事件监听接口 on(channel, listener) 允许前端订阅主进程推送的消息，实现更丰富的交互体验。
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作相关 API，前端可安全控制窗口最小化、最大化、关闭
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),

  // 应用数据相关 API，前端可加载和保存分类、事件等数据
  loadAppData: () => ipcRenderer.invoke("load-app-data"),
  saveAppData: (data) => ipcRenderer.invoke("save-app-data", data),

  // 用户设置相关 API，前端可加载和保存用户个性化设置
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // 通知相关 API，前端可请求主进程弹出系统通知
  notify: (title, body) => ipcRenderer.invoke("notify", { title, body }),

  // 课程导入相关 API，前端可请求主进程解析课程表文件
  importSchedule: () => ipcRenderer.invoke("import-schedule"),

  // 自然语言处理 API，前端可请求主进程解析用户输入的自然语言文本
  processNaturalLanguage: (text) =>
    ipcRenderer.invoke("process-natural-language", text),

  // 语音识别 API，前端可请求主进程进行语音识别（当前为模拟实现）
  recognizeSpeech: () => ipcRenderer.invoke("recognize-speech"),

  // 日志 API，前端可将日志发送到主进程统一记录
  sendLog: (logData) => ipcRenderer.invoke("send-log", logData),

  // 事件监听 API，前端可订阅主进程推送的消息，实现消息通知等功能
  on: (channel, listener) => ipcRenderer.on(channel, listener),
});
