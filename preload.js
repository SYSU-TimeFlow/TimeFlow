/**
 * @file preload.js
 * @description 预加载脚本，在主进程创建窗口时，注入到渲染进程中的脚本，用来安全地暴露有限的主进程 API 给前端页面用。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});
