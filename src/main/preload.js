/**
 * @file preload.js
 * @description 预加载脚本，在主进程创建窗口时，注入到渲染进程中的脚本，用来安全地暴露有限的主进程 API 给前端页面用。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  // 修改：暴露应用数据加载和保存的 API
  loadAppData: () => ipcRenderer.invoke('load-app-data'),
  saveAppData: (data) => ipcRenderer.invoke('save-app-data', data),
  // 保留旧的设置API（如果将来需要） -> 这些将用于新的设置加载/保存逻辑
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  // 新增：通知API
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  // 新增：课程导入API
  importSchedule: () => ipcRenderer.invoke('import-schedule'),
});
