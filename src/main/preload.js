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
  validateStoredConfig: () => ipcRenderer.invoke("validate-stored-config"),
  fetchModels: (config) => ipcRenderer.invoke("fetch-models", config),
  saveEffort: (effort) => ipcRenderer.invoke("save-effort", effort),
  saveModel: (model) => ipcRenderer.invoke("save-model", model),
  parseMarkdown: (text) => ipcRenderer.invoke("parse-markdown", text),
  startLLMStream: (messages, effort) =>
    ipcRenderer.send("start-llm-stream", { messages, effort }),
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
  quitApp: () => ipcRenderer.send("quit-app"),
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
  applyTheme: (name) => ipcRenderer.invoke("apply-theme", name),
  loadActiveTheme: () => ipcRenderer.invoke("load-active-theme"),
  resetActiveTheme: () => ipcRenderer.invoke("reset-active-theme"),
});
