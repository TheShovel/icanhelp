const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dragWindow: (deltaX, deltaY) => ipcRenderer.send('drag-window', { deltaX, deltaY }),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
  hasConfig: () => ipcRenderer.invoke('has-config'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  validateStoredConfig: () => ipcRenderer.invoke('validate-stored-config'),
  fetchModels: (config) => ipcRenderer.invoke('fetch-models', config),
  saveEffort: (effort) => ipcRenderer.invoke('save-effort', effort),
  startLLMStream: (messages, effort) => ipcRenderer.send('start-llm-stream', { messages, effort }),
  onLLMChunk: (callback) => {
    const handler = (_event, chunk) => callback(chunk);
    ipcRenderer.on('llm-chunk', handler);
    return () => ipcRenderer.removeListener('llm-chunk', handler);
  },
});
