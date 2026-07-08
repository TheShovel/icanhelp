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
  quitApp: () => ipcRenderer.send("quit-app"),
  onVisionProgress: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("vision-download-progress", handler);
    return () =>
      ipcRenderer.removeListener("vision-download-progress", handler);
  },
});
