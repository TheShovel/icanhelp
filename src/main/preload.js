const { contextBridge, ipcRenderer } = require("electron");

function buddyArt(name) {
  return "asset://buddyArt/" + name + ".png";
}

contextBridge.exposeInMainWorld("electronAPI", {
  buddyArt: buddyArt,
  dragWindow: (deltaX, deltaY) =>
    ipcRenderer.send("drag-window", { deltaX, deltaY }),
  resizeWindow: (width, height) =>
    ipcRenderer.send("resize-window", { width, height }),
  hasConfig: () => ipcRenderer.invoke("has-config"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  parseMarkdown: (text) => ipcRenderer.invoke("parse-markdown", text),
  startLLMStream: (messages) =>
    ipcRenderer.send("start-llm-stream", { messages }),
  onLLMChunk: (callback) => {
    const handler = (_event, chunk) => callback(chunk);
    ipcRenderer.on("llm-chunk", handler);
    return () => ipcRenderer.removeListener("llm-chunk", handler);
  },
  sendSudoPassword: (password) => ipcRenderer.send("sudo-response", password),
  sendConfirmResponse: (ok) => ipcRenderer.send("confirm-response", ok),
  cancelStream: () => ipcRenderer.send("cancel-stream"),
  	loadChats: () => ipcRenderer.invoke("load-chats"),
  	saveChats: (chats) => ipcRenderer.invoke("save-chats", chats),
  	saveChat: (chat) => ipcRenderer.invoke("save-chat", chat),
  	deleteChat: (chatId) => ipcRenderer.invoke("delete-chat", chatId),
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  onOpenSettings: (callback) => {
    ipcRenderer.on("open-settings", () => callback());
  },
  onOpenChatList: (callback) => {
    ipcRenderer.on("open-chat-list", () => callback());
  },
  selectAttachment: () => ipcRenderer.invoke("select-attachment"),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  saveFileAs: (sourcePath, defaultName) => ipcRenderer.invoke("save-file-as", sourcePath, defaultName),
  quitApp: () => ipcRenderer.send("quit-app"),
  restartApp: () => ipcRenderer.send("restart-app"),
  onVisionProgress: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("vision-download-progress", handler);
    return () =>
      ipcRenderer.removeListener("vision-download-progress", handler);
  },
  onApplyTheme: (callback) => {
    const handler = (_event, properties) => callback(properties);
    ipcRenderer.on("apply-theme", handler);
    return () => ipcRenderer.removeListener("apply-theme", handler);
  },
  onThemesChanged: (callback) => {
    ipcRenderer.on("themes-changed", () => callback());
    return () => ipcRenderer.removeListener("themes-changed", callback);
  },
  loadThemes: () => ipcRenderer.invoke("load-themes"),
  deleteTheme: (name) => ipcRenderer.invoke("delete-theme", name),
  getDefaultThemes: () => ipcRenderer.invoke("get-default-themes"),
  applyTheme: (name) => ipcRenderer.invoke("apply-theme", name),
  loadActiveTheme: () => ipcRenderer.invoke("load-active-theme"),
  resetActiveTheme: () => ipcRenderer.invoke("reset-active-theme"),
  getRecommendedModels: () => ipcRenderer.invoke("get-recommended-models"),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getCompatibleModels: () => ipcRenderer.invoke("get-compatible-models"),
  getExtraModels: () => ipcRenderer.invoke("get-extra-models"),
  listDownloadedModels: () => ipcRenderer.invoke("list-downloaded-models"),
  downloadModel: (modelId) => ipcRenderer.invoke("download-model", modelId),
  deleteModel: (filename) => ipcRenderer.invoke("delete-model", filename),
  onModelDownloadProgress: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("model-download-progress", handler);
    return () => ipcRenderer.removeListener("model-download-progress", handler);
  },
  preloadModel: () => ipcRenderer.invoke("preload-model"),
  onModelPreloadProgress: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("model-preload-progress", handler);
    return () => ipcRenderer.removeListener("model-preload-progress", handler);
  },
  renderMath: (tex, displayMode) => ipcRenderer.invoke("render-math", tex, displayMode),
  resetAllData: () => ipcRenderer.invoke("reset-all-data"),
  openFolder: (key) => ipcRenderer.invoke("open-folder", key),
});
