const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dragWindow: (deltaX, deltaY) => ipcRenderer.send('drag-window', { deltaX, deltaY }),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
  askLLM: (messages) => ipcRenderer.invoke('ask-llm', messages),
  hasConfig: () => ipcRenderer.invoke('has-config'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  validateStoredConfig: () => ipcRenderer.invoke('validate-stored-config'),
  fetchModels: (config) => ipcRenderer.invoke('fetch-models', config),
});
