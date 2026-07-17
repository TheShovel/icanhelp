const avatar = document.getElementById("avatar");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatListPanel = document.getElementById("chat-list-panel");
const chatListBody = document.getElementById("chat-list-body");
const cancelBtn = document.getElementById("cancel-btn");
const typingIndicator = document.getElementById("typing-indicator");
const settingsMenuPanel = document.getElementById("settings-menu-panel");
const themePanel = document.getElementById("theme-panel");
const addonsPanel = document.getElementById("addons-panel");
const resetThemeBtn = document.getElementById("theme-reset");
const sudoOverlay = document.getElementById("sudo-overlay");
const sudoInput = document.getElementById("sudo-input");
const sudoSubmit = document.getElementById("sudo-submit");
const sudoCancel = document.getElementById("sudo-cancel");
const sudoStatus = document.getElementById("sudo-status");
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmCommand = document.getElementById("confirm-command");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");
const captchaOverlay = document.getElementById("captcha-overlay");
const captchaOk = document.getElementById("captcha-ok");
const avatarInner = document.getElementById("avatar-inner");
const attachMenu = document.getElementById("attach-menu");
const attachBtn = document.getElementById("attach-btn");
const attachmentPreview = document.getElementById("attachment-preview");
const attachmentName = document.getElementById("attachment-name");
const removeAttachment = document.getElementById("remove-attachment");
const installScreen = document.getElementById("install-screen");
const installAvatar = document.getElementById("install-avatar");
const installSpinner = document.getElementById("install-spinner");
const installProgressFill = document.getElementById("install-progress-fill");
const installProgressBar = document.getElementById("install-progress-bar");
const installPct = document.getElementById("install-pct");
const installSize = document.getElementById("install-size");
const installSubtitle = document.getElementById("install-subtitle");
const installTitle = document.getElementById("install-title");
const installBack = document.getElementById("install-back");
const installModelList = document.getElementById("install-model-list");
const resizeHandle = document.getElementById("resize-handle");

avatarInner.src = window.electronAPI.buddyArt("idle");
installAvatar.src = window.electronAPI.buddyArt("idle");
document.getElementById("install-back").innerHTML = iconSvg("close", 16);
document.getElementById("install-back").addEventListener("click", function () {
  closeModelPicker();
});
document.getElementById("close-settings-menu").innerHTML = iconSvg("close", 16);
document.getElementById("close-addons").innerHTML = iconSvg("close", 16);
document.getElementById("close-theme").innerHTML = iconSvg("close", 16);
document.getElementById("send-btn").innerHTML = iconSvg("send", 16);
document.getElementById("cancel-btn").innerHTML = iconSvg("close", 16);
document.getElementById("burger-btn").innerHTML = iconSvg("menu", 18);
document.getElementById("close-chat-list").innerHTML = iconSvg("close", 16);
attachBtn.innerHTML = iconSvg("paperclip", 16);
removeAttachment.innerHTML = iconSvg("close", 14);

let currentAttachment = null;
let attachmentToken = 0;
let selectedBackend = "gpu";
let isSetupScreen = false;
var toolFilePaths = [];
var webSources = [];

function renderAttachment() {
  attachmentPreview.classList.remove("loading", "ready", "error");

  if (!currentAttachment) {
    attachmentPreview.classList.add("hidden");
    attachmentName.textContent = "";
    attachmentPreview.title = "";
    return;
  }

  attachmentPreview.classList.remove("hidden");
  if (currentAttachment.status) {
    attachmentPreview.classList.add(currentAttachment.status);
  }

  if (currentAttachment.status === "error" && currentAttachment.error) {
    attachmentName.textContent = currentAttachment.error;
  } else {
    attachmentName.textContent =
      currentAttachment.label || currentAttachment.name;
  }
  attachmentPreview.title =
    currentAttachment.error || currentAttachment.name || "";
}

function clearAttachment() {
  currentAttachment = null;
  renderAttachment();
  attachBtn.classList.remove("hidden");
  attachBtn.disabled = false;
}

function consumeAttachment(text) {
  if (!currentAttachment) return { display: text, attachmentData: null };

  if (currentAttachment.status === "loading") {
    currentAttachment.label = "Still reading...";
    renderAttachment();
    return { display: null, attachmentData: null };
  }

  if (currentAttachment.status === "error") {
    if (!text) return { display: null, attachmentData: null };
    clearAttachment();
    return { display: text, attachmentData: null };
  }

  const ocr =
    (currentAttachment.text || "").trim() || "No readable text found.";
  const attachmentData = {
    name: currentAttachment.name,
    path: currentAttachment.path,
    type: currentAttachment.type,
    text: ocr,
  };

  var display = text || "📎 " + currentAttachment.name;
  clearAttachment();
  return { display: display, attachmentData: attachmentData };
}

function expandAttachment(msg) {
  if (!msg.attachment) return msg;

  var label =
    msg.attachment.type === "image" ? "Image OCR content" : "File content";
  var parts = [
    "[Attached file - already analyzed]",
    "Name: " + msg.attachment.name,
  ];

  if (msg.attachment.path) {
    parts.push("Absolute path: " + msg.attachment.path);
    parts.push(
      "This attachment metadata is hidden from the user. Use this exact path if you need to inspect the file. Do not search for the file path, and do not mention the path unless the user asks for it.",
    );
  }

  parts.push(
    "[" +
      label +
      "]\n" +
      (msg.attachment.text || "No readable content extracted."),
  );

  if (msg.content && msg.content !== "📎 " + msg.attachment.name) {
    parts.push("User message: " + msg.content);
  }

  return { role: msg.role, content: parts.join("\n\n") };
}

attachBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  attachMenu.classList.toggle("hidden");
});

document.addEventListener("click", function (e) {
  if (
    !attachMenu.classList.contains("hidden") &&
    !attachBtn.contains(e.target) &&
    !attachMenu.contains(e.target)
  ) {
    attachMenu.classList.add("hidden");
  }
});

attachMenu.addEventListener("click", async function (e) {
  var item = e.target.closest(".attach-menu-item");
  if (!item) return;
  var action = item.dataset.action;
  attachMenu.classList.add("hidden");

  if (action === "file") {
    await pickFileAttachment();
  } else if (action === "screenshot") {
    await takeScreenshotAttachment();
  }
});

async function pickFileAttachment() {
  const token = ++attachmentToken;
  attachBtn.disabled = true;
  currentAttachment = { label: "Reading file...", status: "loading" };
  renderAttachment();

  try {
    const attachment = await window.electronAPI.selectAttachment();
    if (token !== attachmentToken) return;
    if (!attachment) {
      clearAttachment();
      return;
    }
    currentAttachment = Object.assign({ status: "ready" }, attachment);
    renderAttachment();
    attachBtn.classList.add("hidden");
    chatInput.focus();
  } catch (e) {
    if (token !== attachmentToken) return;
    currentAttachment = {
      label: "File error",
      status: "error",
      error: e.message || "Could not read file.",
    };
    renderAttachment();
    attachBtn.classList.remove("hidden");
  } finally {
    if (token === attachmentToken) attachBtn.disabled = false;
  }
}

async function takeScreenshotAttachment() {
  const token = ++attachmentToken;
  attachBtn.disabled = true;
  currentAttachment = { label: "Taking screenshot...", status: "loading" };
  renderAttachment();

  try {
    const attachment = await window.electronAPI.takeScreenshot();
    if (token !== attachmentToken) return;
    if (!attachment) {
      clearAttachment();
      return;
    }
    currentAttachment = Object.assign({ status: "ready" }, attachment);
    renderAttachment();
    attachBtn.classList.add("hidden");
    chatInput.focus();
  } catch (e) {
    if (token !== attachmentToken) return;
    currentAttachment = {
      label: "Screenshot error",
      status: "error",
      error: e.message || "Could not take screenshot.",
    };
    renderAttachment();
    attachBtn.classList.remove("hidden");
  } finally {
    if (token === attachmentToken) attachBtn.disabled = false;
  }
}

removeAttachment.addEventListener("click", function () {
  attachmentToken++;
  clearAttachment();
});

sudoSubmit.addEventListener("click", function () {
  var pw = sudoInput.value;
  if (!pw) {
    sudoStatus.textContent = "Password required.";
    return;
  }
  sudoOverlay.classList.add("hidden");
  window.electronAPI.sendSudoPassword(pw);
  sudoInput.value = "";
  sudoStatus.textContent = "";
});

sudoCancel.addEventListener("click", function () {
  sudoOverlay.classList.add("hidden");
  window.electronAPI.sendSudoPassword("");
  sudoInput.value = "";
  sudoStatus.textContent = "";
});

sudoInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sudoSubmit.click();
  if (e.key === "Escape") sudoCancel.click();
});

confirmYes.addEventListener("click", function () {
  confirmOverlay.classList.add("hidden");
  window.electronAPI.sendConfirmResponse(true);
});

confirmNo.addEventListener("click", function () {
  confirmOverlay.classList.add("hidden");
  window.electronAPI.sendConfirmResponse(false);
});

captchaOk.addEventListener("click", function () {
  captchaOverlay.classList.add("hidden");
});

let chatOpen = false;
let isDragging = false;
let didDrag = false;
let dragStartX = 0;
let dragStartY = 0;
let conversation = [];
let isProcessing = false;
let lastChatSize = { width: 400, height: 550 };
let responseStartTime = 0;
var modelInfo = { name: "", backend: "CPU" };

// Load model config info for the response footer
window.electronAPI.getConfig().then(function (cfg) {
  if (cfg && cfg.modelPath) {
    var name = cfg.modelPath.split("/").pop().replace(/\.gguf$/i, "").replace(/_/g, " ");
    modelInfo.name = name;
    modelInfo.backend = (cfg.gpuLayers === "max" || cfg.gpuLayers > 0) ? "GPU" : "CPU";
  }
});
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartW = 0;
let resizeStartH = 0;

function setAvatarState(state) {
  var img = avatarInner;
  var src = window.electronAPI.buddyArt(state);
  if (img.src !== src) img.src = src;
  avatar.className = "";
  if (state && state !== "idle") avatar.classList.add("avatar-" + state);
}

avatar.addEventListener("mousedown", (e) => {
  isDragging = true;
  didDrag = false;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  avatar.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  didDrag = true;
  const deltaX = e.screenX - dragStartX;
  const deltaY = e.screenY - dragStartY;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  window.electronAPI.dragWindow(deltaX, deltaY);
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    avatar.style.cursor = "pointer";
  }
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "";
  }
});

resizeHandle.addEventListener("mousedown", function (e) {
  isResizing = true;
  resizeStartX = e.screenX;
  resizeStartY = e.screenY;
  resizeStartW = window.innerWidth;
  resizeStartH = window.innerHeight;
  document.body.style.cursor = "nwse-resize";
  e.preventDefault();
});

document.addEventListener("mousemove", function (e) {
  if (!isResizing) return;
  var newW = Math.max(300, resizeStartW + (resizeStartX - e.screenX));
  var newH = Math.max(400, resizeStartH + (resizeStartY - e.screenY));
  lastChatSize.width = newW;
  lastChatSize.height = newH;
  window.electronAPI.resizeWindow(newW, newH);
});

// --- Chat Management ---
var chats = [];
var currentChatId = null;

function generateId() {
  return "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function getCurrentChat() {
  return chats.find(function (c) {
    return c.id === currentChatId;
  });
}

async function saveCurrentChat() {
  var chat = getCurrentChat();
  if (chat) {
    await window.electronAPI.saveChat(chat);
  }
}

function saveChatsToStore() {
  saveCurrentChat();
}

function renderChatList() {
  chatListBody.innerHTML = "";
  var sorted = chats.slice().sort(function (a, b) {
    return b.updatedAt - a.updatedAt;
  });
  sorted.forEach(function (chat) {
    var item = document.createElement("div");
    item.className = "chat-list-item";
    if (chat.id === currentChatId) item.classList.add("active");

    var nameSpan = document.createElement("span");
    nameSpan.className = "chat-list-name";
    var preview = "";
    if (chat.messages.length > 0) {
      var last = chat.messages[chat.messages.length - 1];
      preview = last.content.slice(0, 40);
      if (last.content.length > 40) preview += "…";
    }
    var displayName = chat.name || "New Chat";
    nameSpan.textContent = displayName + (preview ? ": " + preview : "");

    var delBtn = document.createElement("button");
    delBtn.className = "chat-list-del";
    delBtn.innerHTML = iconSvg("close", 12);
    delBtn.title = "Delete";

    delBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (chats.length <= 1) return;
      var wasActive = chat.id === currentChatId;
      chats = chats.filter(function (c) {
        return c.id !== chat.id;
      });
      window.electronAPI.deleteChat(chat.id);
      if (wasActive) {
        currentChatId = chats[0].id;
        chatMessages.querySelectorAll(".message").forEach(function (el) {
          el.remove();
        });
        var newChat = chats[0];
        for (var m of newChat.messages) {
          addMessage(m);
        }
        requestAnimationFrame(function () {
          smoothScroll(chatMessages);
        });
      }
      renderChatList();
      saveCurrentChat();
    });

    item.appendChild(nameSpan);
    item.appendChild(delBtn);
    item.addEventListener("click", function () {
      switchToChat(chat.id);
    });
    chatListBody.appendChild(item);
  });
}

function createNewChat() {
  var chat = {
    id: generateId(),
    name: null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  chats.push(chat);
  window.electronAPI.saveChat(chat);
  return chat.id;
}

function autoNameChat(chat, text) {
  if (chat.name) return;
  var name = text.trim().replace(/\s+/g, " ").slice(0, 40);
  if (name.length === 0) name = "New Chat";
  if (name.length >= 40) name += "…";
  chat.name = name;
}

function switchToChat(chatId) {
  if (chatId === currentChatId) return;
  currentChatId = chatId;

  sendBtn.classList.remove("hidden");
  cancelBtn.classList.add("hidden");
  isProcessing = false;
  chatInput.disabled = false;
  sendBtn.disabled = false;

  chatMessages.querySelectorAll(".message").forEach(function (el) {
    el.remove();
  });

  var chat = getCurrentChat();
  if (chat) {
    if (chat.messages.length === 0) {
      renderEmptyState();
    } else {
      for (var m of chat.messages) {
        addMessage(m);
      }
    }
    requestAnimationFrame(function () {
      smoothScroll(chatMessages);
    });
  }

  requestAnimationFrame(function () {
    chatInput.focus();
  });

  renderChatList();
  chatListPanel.classList.add("hidden");
}

function ensureCurrentChat() {
  if (!currentChatId) {
    if (chats.length === 0) {
      currentChatId = createNewChat();
    } else {
      currentChatId = chats[0].id;
    }
  }
}

window.electronAPI.loadChats().then(async function (loaded) {
  chats = (loaded || []).map(function (c) {
    return { updatedAt: 0, messages: [], name: "Chat", ...c };
  });
  if (chats.length === 0) {
    currentChatId = createNewChat();
  } else {
    chats.sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    currentChatId = chats[0].id;
    var msgs = chats[0].messages || [];
    if (msgs.length === 0) {
      renderEmptyState();
    } else {
      for (var m of msgs) {
        await addMessage(m);
      }
    }
    requestAnimationFrame(function () {
      smoothScroll(chatMessages);
    });
  }
  sendBtn.classList.remove("hidden");
  renderChatList();
});

function closeChatList() {
  chatListPanel.classList.add("hidden");
  sendBtn.classList.remove("hidden");
}

document
  .getElementById("close-chat-list")
  .addEventListener("click", closeChatList);

function togglePanel() {
  chatOpen = !chatOpen;
  if (chatOpen) {
    window.electronAPI.resizeWindow(lastChatSize.width, lastChatSize.height);
    chatPanel.classList.remove("hidden");
    setTimeout(function () {
      chatInput.focus();
      smoothScroll(chatMessages);
    }, 150);
  } else {
    chatPanel.classList.add("hidden");
    window.electronAPI.resizeWindow(88, 88);
  }
}

avatar.addEventListener("click", (e) => {
  if (didDrag) return;
  togglePanel();
});

avatar.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  window.electronAPI.showContextMenu();
});

window.electronAPI.onOpenSettings(function () {
  if (!chatOpen) togglePanel();
  chatPanel.classList.add("hidden");
  themePanel.classList.add("hidden");
  settingsMenuPanel.classList.remove("hidden");
});

window.electronAPI.onOpenChatList(function () {
  if (!chatOpen) togglePanel();
  ensureCurrentChat();
  renderChatList();
  chatListPanel.classList.remove("hidden");
  sendBtn.classList.add("hidden");
});

cancelBtn.addEventListener("click", function () {
  sendBtn.classList.remove("hidden");
  cancelBtn.classList.add("hidden");
  isProcessing = false;
  chatInput.disabled = false;
  sendBtn.disabled = false;
  setAvatarState("idle");
  window.electronAPI.cancelStream();
});

const burgerBtn = document.getElementById("burger-btn");
const burgerMenu = document.getElementById("burger-menu");

var menuItems = [
  { action: "new-chat", label: "New Chat", icon: "sparkle" },
  { action: "chat-history", label: "Chat History", icon: "folder" },
  { action: "settings", label: "Settings", icon: "settings" },
];
document.querySelectorAll(".burger-item[data-action]").forEach(function (el) {
  var info = menuItems.find(function (m) {
    return m.action === el.dataset.action;
  });
  if (info) {
    el.innerHTML = iconSvg(info.icon, 16) + " " + info.label;
  } else if (el.dataset.action === "quit") {
    el.innerHTML = "Quit";
  }
});

burgerBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  burgerMenu.classList.toggle("hidden");
});

burgerMenu.addEventListener("click", function (e) {
  var item = e.target.closest(".burger-item");
  if (!item) return;
  var action = item.dataset.action;
  burgerMenu.classList.add("hidden");

  if (action === "new-chat") {
    var id = createNewChat();
    switchToChat(id);
  } else if (action === "chat-history") {
    ensureCurrentChat();
    renderChatList();
    chatListPanel.classList.remove("hidden");
    sendBtn.classList.add("hidden");
  } else if (action === "settings") {
    if (!chatOpen) togglePanel();
    chatPanel.classList.add("hidden");
    themePanel.classList.add("hidden");
    settingsMenuPanel.classList.remove("hidden");
  } else if (action === "quit") {
    window.electronAPI.quitApp();
  }
});

document.addEventListener("click", function (e) {
  if (
    !burgerMenu.classList.contains("hidden") &&
    !burgerBtn.contains(e.target) &&
    !burgerMenu.contains(e.target)
  ) {
    burgerMenu.classList.add("hidden");
  }
});

document
  .getElementById("settings-menu-body")
  .addEventListener("click", function (e) {
    var item = e.target.closest(".settings-menu-item");
    if (!item) return;
    var action = item.dataset.action;

    if (action === "theme") {
      settingsMenuPanel.classList.add("hidden");
      themePanel.classList.remove("hidden");
      renderThemeList();
    } else if (action === "model") {
      settingsMenuPanel.classList.add("hidden");
      openModelPicker();
    } else if (action === "addons") {
      settingsMenuPanel.classList.add("hidden");
      addonsPanel.classList.remove("hidden");
      renderAddonModels();
    } else if (action === "open-config") {
      window.electronAPI.openFolder("config");
    } else if (action === "open-models") {
      window.electronAPI.openFolder("models");
    } else if (action === "open-buddy-art") {
      window.electronAPI.openFolder("buddy-art");
    } else if (action === "reset") {
      if (item.dataset.confirmed !== "true") {
        item.dataset.confirmed = "true";
        item.querySelector("span:first-child").textContent = "Confirm Reset";
        item.querySelector(".settings-menu-hint").textContent =
          "Click again to wipe everything. This cannot be undone.";
        setTimeout(function () {
          if (item.dataset.confirmed === "true") {
            delete item.dataset.confirmed;
            item.querySelector("span:first-child").textContent =
              "Reset All Data";
            item.querySelector(".settings-menu-hint").textContent =
              "Wipe config, models, knowledge base, and chats";
          }
        }, 5000);
      } else {
        delete item.dataset.confirmed;
        item.querySelector("span:first-child").textContent = "Resetting...";
        item.querySelector(".settings-menu-hint").textContent = "";
        item.style.pointerEvents = "none";
        item.style.opacity = "0.5";
        window.electronAPI.resetAllData().then(function (result) {
          if (result.ok) {
            window.electronAPI.quitApp();
          } else {
            item.querySelector("span:first-child").textContent = "Reset Failed";
            item.querySelector(".settings-menu-hint").textContent = (
              result.errors || ["Unknown error"]
            ).join(", ");
            item.style.pointerEvents = "";
            item.style.opacity = "";
          }
        });
      }
    }
  });

document
  .getElementById("close-settings-menu")
  .addEventListener("click", function () {
    settingsMenuPanel.classList.add("hidden");
    chatPanel.classList.remove("hidden");
  });

document.getElementById("close-theme").addEventListener("click", function () {
  themePanel.classList.add("hidden");
  settingsMenuPanel.classList.remove("hidden");
});

document.getElementById("close-addons").addEventListener("click", function () {
  addonsPanel.classList.add("hidden");
  settingsMenuPanel.classList.remove("hidden");
});

var themeListEl = document.getElementById("theme-list");

function renderThemeList() {
  if (!themeListEl) return;
  themeListEl.innerHTML = "";
  Promise.all([
    window.electronAPI.loadThemes(),
    window.electronAPI.getDefaultThemes(),
  ]).then(function ([themes, defaultNames]) {
    var names = Object.keys(themes).sort();
    window.electronAPI.loadActiveTheme().then(function (active) {
      var activeName = active ? active.name : null;
      if (names.length === 0) {
        themeListEl.innerHTML =
          '<div class="theme-item-empty">No saved themes yet. Ask the AI to create one.</div>';
        return;
      }
      for (var i = 0; i < names.length; i++) {
        var item = document.createElement("div");
        item.className = "theme-item";
        item.dataset.name = names[i];
        if (names[i] === activeName) item.classList.add("active");

        var isDefault = defaultNames.indexOf(names[i]) !== -1;
        if (isDefault) item.classList.add("theme-item-default");

        var nameSpan = document.createElement("span");
        nameSpan.className = "theme-item-name";
        nameSpan.textContent = names[i];
        if (isDefault) {
          var badge = document.createElement("span");
          badge.className = "theme-item-badge";
          badge.textContent = "built-in";
          nameSpan.appendChild(badge);
        }
        item.appendChild(nameSpan);

        if (!isDefault) {
          var delBtn = document.createElement("button");
          delBtn.className = "theme-item-del";
          delBtn.innerHTML = iconSvg("close", 12);
          delBtn.title = "Delete";
          delBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            var item = this.closest(".theme-item");
            var n = item.dataset.name;
            if (n) {
              window.electronAPI.deleteTheme(n).then(function () {
                item.remove();
                if (!themeListEl.querySelector(".theme-item")) {
                  themeListEl.innerHTML =
                    '<div class="theme-item-empty">No saved themes yet.</div>';
                }
              });
            }
          });
          item.appendChild(delBtn);
        }

        item.addEventListener("click", function () {
          var n = this.dataset.name;
          if (n) {
            window.electronAPI.applyTheme(n);
          }
        });

        themeListEl.appendChild(item);
      }
    });
  });
}

resetThemeBtn.addEventListener("click", function () {
  document.documentElement.removeAttribute("style");
  window.electronAPI.resetActiveTheme();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!chatListPanel.classList.contains("hidden")) {
      closeChatList();
      return;
    }
    if (!addonsPanel.classList.contains("hidden")) {
    addonsPanel.classList.add("hidden");
    settingsMenuPanel.classList.remove("hidden");
    return;
  }
  if (!themePanel.classList.contains("hidden")) {
      themePanel.classList.add("hidden");
      settingsMenuPanel.classList.remove("hidden");
      return;
    }
    if (!settingsMenuPanel.classList.contains("hidden")) {
      settingsMenuPanel.classList.add("hidden");
      chatPanel.classList.remove("hidden");
      return;
    }
    if (chatOpen) togglePanel();
  }
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    chatInput.blur();
    togglePanel();
  }
});

// Register download progress handler globally (needed for both initial install and settings)
window.electronAPI.onModelDownloadProgress(function (info) {
  if (info.stage === "downloading") {
    installProgressFill.style.width = info.progress + "%";
    installPct.textContent = info.progress + "%";
    if (info.total) {
      var mb = (info.received / (1024 * 1024)).toFixed(0);
      var totalMb = (info.total / (1024 * 1024)).toFixed(0);
      installSize.textContent = mb + " MB / " + totalMb + " MB";
    }
  }
});

// --- Install Screen ---
(async function initInstall() {
  var hasCfg = await window.electronAPI.hasConfig();
  if (hasCfg) {
    var cfg = await window.electronAPI.getConfig();
    if (cfg && cfg.modelPath) {
      installScreen.classList.add("hidden");
      chatPanel.classList.remove("hidden");
      sendBtn.classList.remove("hidden");
      chatOpen = true;
      window.electronAPI.resizeWindow(400, 550);
      setTimeout(function () {
        chatInput.focus();
        smoothScroll(chatMessages);
      }, 150);
      return;
    }
  }

  window.electronAPI.resizeWindow(320, 420);

  installScreen.classList.remove("hidden");
  chatPanel.classList.add("hidden");
  sendBtn.classList.add("hidden");


  isSetupScreen = true;
  var sysInfo = await window.electronAPI.getSystemInfo();
  var allModels = await window.electronAPI.getRecommendedModels();
  var compatModels = await window.electronAPI.getCompatibleModels();
  var extraModels = await window.electronAPI.getExtraModels();

  renderModelPicker(allModels, compatModels, sysInfo, extraModels);
})();

async function renderAddonModels() {
  var list = document.getElementById("addons-list");
  if (!list) return;
  list.innerHTML = "";

  try {
    var models = await window.electronAPI.getExtraModels();

    if (!models || models.length === 0) {
      list.innerHTML = '<p style="color: var(--fg-muted); font-size: 12px;">No addon models available.</p>';
      return;
    }

    models.forEach(function (m) {
      var isDownloaded = m.downloaded;
      var isVision = m.role === "vision";
      var card = document.createElement("div");
      card.className = "addon-model-card";
      if (!m.compatible) card.classList.add("disabled");
      if (isDownloaded) card.classList.add("downloaded");

      var top = document.createElement("div");
      top.className = "addon-model-top";
      var nameEl = document.createElement("span");
      nameEl.className = "addon-model-name";
      nameEl.textContent = m.name;
      top.appendChild(nameEl);
      var roleEl = document.createElement("span");
      roleEl.className = "addon-model-role";
      roleEl.textContent = (isVision ? "vision" : m.role || "addon") + (isDownloaded ? " · ready" : "");
      top.appendChild(roleEl);
      card.appendChild(top);

      var meta = document.createElement("div");
      meta.className = "addon-model-meta";
      meta.innerHTML = "<span>" + (m.quality || "") + "</span><span>" + m.size + "</span>";
      card.appendChild(meta);

      var desc = document.createElement("div");
      desc.className = "addon-model-desc";
      desc.textContent = m.description;
      card.appendChild(desc);

      var note = document.createElement("div");
      note.className = "addon-model-note";
      if (isDownloaded) {
        note.textContent = "Ready to use";
      } else {
        note.textContent = m.compatible ? "Click to download" : "Needs ~" + m.minRamGB + " GB RAM";
      }
      card.appendChild(note);

      if (m.compatible && !isDownloaded) {
        var clicked = false;
        card.addEventListener("click", function () {
          if (clicked) return;
          clicked = true;
          card.classList.add("downloading");
          note.textContent = "Downloading...";

          if (isVision) {
            window.electronAPI.preloadVision().then(function () {
              note.textContent = "Ready to use";
              card.classList.remove("downloading");
              card.classList.add("downloaded");
            }).catch(function () {
              note.textContent = "Download failed";
              card.classList.remove("downloading");
            });
          } else {
            startModelDownload(m.id, m.name, "addons").finally(function () {
              note.textContent = "Done";
              card.classList.remove("downloading");
            });
          }
        });
      }

      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '<p style="color: var(--danger); font-size: 12px;">Failed to load addons.</p>';
  }
}


function renderModelPicker(allModels, compatModels, sysInfo, extraModels) {
  installModelList.innerHTML = "";
  installSpinner.classList.add("hidden");
  installProgressBar.classList.add("hidden");
  installProgressFill.style.width = "0%";
  installPct.textContent = "";
  installSize.textContent = "";

  var compatIds = {};
  for (var j = 0; j < compatModels.length; j++) {
    compatIds[compatModels[j].id] = true;
  }

  var ramNote = document.createElement("p");
  ramNote.id = "install-ram-note";
  ramNote.textContent =
    "System: " +
    sysInfo.totalRamGB +
    " GB RAM" +
    (sysInfo.freeRamGB < sysInfo.totalRamGB
      ? " (" + sysInfo.freeRamGB + " GB free)"
      : "") +
    " · " +
    sysInfo.cpuCores +
    " cores · " +
    sysInfo.gpuInfo +
    (sysInfo.gpuVramGB > 0
      ? " (" + sysInfo.gpuVramGB.toFixed(1) + " GB VRAM)"
      : "");
  installModelList.appendChild(ramNote);

  var gpuVramGB = sysInfo.gpuVramGB || 0;
  var gpuAvailable = gpuVramGB >= 7.5;
  if (!gpuAvailable) selectedBackend = "cpu";

  var backendWrap = document.createElement("div");
  backendWrap.className = "backend-selector";

  var backendTitle = document.createElement("p");
  backendTitle.className = "backend-title";
  backendTitle.textContent = "Run model on:";
  backendWrap.appendChild(backendTitle);

  var backendOptions = document.createElement("div");
  backendOptions.className = "backend-options";

  var gpuBtn = document.createElement("button");
  gpuBtn.type = "button";
  gpuBtn.className =
    "backend-option" + (selectedBackend === "gpu" ? " selected" : "");
  gpuBtn.disabled = !gpuAvailable;
  gpuBtn.innerHTML =
    '<span class="backend-name">GPU' +
    (gpuAvailable
      ? '<span class="install-model-badge">Recommended</span>'
      : "") +
    "</span>" +
    '<span class="backend-desc">Uses VRAM. Faster responses, but needs ≥8 GB VRAM.</span>';
  if (!gpuAvailable) {
    var gpuWarn = document.createElement("span");
    gpuWarn.className = "backend-warn";
    gpuWarn.textContent =
      "Disabled: only " +
      gpuVramGB.toFixed(1) +
      " GB VRAM detected (need ≥8 GB)";
    gpuBtn.appendChild(gpuWarn);
  }
  function selectBackend(backend) {
    if (selectedBackend === backend) return;
    selectedBackend = backend;
    gpuBtn.classList.toggle("selected", backend === "gpu");
    cpuBtn.classList.toggle("selected", backend === "cpu");
    var config = { gpuLayers: backend === "gpu" ? "max" : 0 };
    window.electronAPI.saveConfig(config).then(function () {
      if (!isSetupScreen) window.electronAPI.restartApp();
    });
  }
  gpuBtn.addEventListener("click", function () {
    selectBackend("gpu");
  });
  backendOptions.appendChild(gpuBtn);

  var cpuBtn = document.createElement("button");
  cpuBtn.type = "button";
  cpuBtn.className =
    "backend-option" + (selectedBackend === "cpu" ? " selected" : "");
  cpuBtn.innerHTML =
    '<span class="backend-name">CPU' +
    (gpuAvailable
      ? ""
      : '<span class="install-model-badge">Recommended</span>') +
    "</span>" +
    '<span class="backend-desc">Uses RAM. Works everywhere, but slower than GPU.</span>';
  cpuBtn.addEventListener("click", function () {
    selectBackend("cpu");
  });
  backendOptions.appendChild(cpuBtn);

  backendWrap.appendChild(backendOptions);
  installModelList.appendChild(backendWrap);

  var hasCompatible = false;
  for (var i = 0; i < allModels.length; i++) {
    var m = allModels[i];
    if (m.role === "extract" || m.role === "math") continue;
    var isCompatible = !!compatIds[m.id];
    if (isCompatible) hasCompatible = true;

    var card = document.createElement("button");
    card.className =
      "install-model-card" + (isCompatible ? "" : " incompatible");
    card.disabled = !isCompatible;

    var topRow = document.createElement("div");
    topRow.className = "install-model-top";

    var nameEl = document.createElement("span");
    nameEl.className = "install-model-name";
    nameEl.textContent = m.name;
    topRow.appendChild(nameEl);

    if (m.recommended) {
      var recEl = document.createElement("span");
      recEl.className = "install-model-badge";
      recEl.textContent = "Recommended";
      topRow.appendChild(recEl);
    }

    card.appendChild(topRow);

    var metaRow = document.createElement("div");
    metaRow.className = "install-model-meta";

    if (m.quality) {
      var qualEl = document.createElement("span");
      qualEl.className = "install-model-quality";
      qualEl.textContent = m.quality;
      metaRow.appendChild(qualEl);
    }

    var sizeEl = document.createElement("span");
    sizeEl.className = "install-model-size";
    sizeEl.textContent = m.size;
    metaRow.appendChild(sizeEl);

    card.appendChild(metaRow);

    var descEl = document.createElement("span");
    descEl.className = "install-model-desc";
    descEl.textContent = m.description;
    card.appendChild(descEl);

    var noteEl = document.createElement("span");
    noteEl.className = "install-model-note";
    if (!isCompatible) {
      noteEl.textContent =
        "Needs ~" + m.minRamGB + " GB RAM — not enough free memory";
    } else if (m.sizeBytes < 1000000000) {
      noteEl.textContent = "Low quality — use for simple tasks only";
    } else if (m.sizeBytes > 2000000000) {
      noteEl.textContent = "Larger models are slower and use more resources";
    }
    card.appendChild(noteEl);

    if (isCompatible) {
      card.addEventListener(
        "click",
        (function (mid, mname) {
          return function () {
            startModelDownload(mid, mname);
          };
        })(m.id, m.name),
      );
    }

    installModelList.appendChild(card);
  }

  if (extraModels && extraModels.length > 0) {
    var sep = document.createElement("div");
    sep.className = "install-model-separator";
    var sepLabel = document.createElement("span");
    sepLabel.textContent = "Extra";
    sep.appendChild(sepLabel);
    installModelList.appendChild(sep);

    for (var k = 0; k < extraModels.length; k++) {
      var em = extraModels[k];
      var eCard = document.createElement("button");
      eCard.className =
        "install-model-card install-model-extra" +
        (em.compatible ? "" : " incompatible");
      eCard.disabled = !em.compatible;

      var eTopRow = document.createElement("div");
      eTopRow.className = "install-model-top";

      var eNameEl = document.createElement("span");
      eNameEl.className = "install-model-name";
      eNameEl.textContent = em.name;
      eTopRow.appendChild(eNameEl);

      var eBadge = document.createElement("span");
      eBadge.className = "install-model-badge install-model-badge-extra";
      eBadge.textContent = "Extra";
      eTopRow.appendChild(eBadge);

      eCard.appendChild(eTopRow);

      var eMetaRow = document.createElement("div");
      eMetaRow.className = "install-model-meta";

      var eQualEl = document.createElement("span");
      eQualEl.className = "install-model-quality";
      eQualEl.textContent = em.quality || "Utility";
      eMetaRow.appendChild(eQualEl);

      var eSizeEl = document.createElement("span");
      eSizeEl.className = "install-model-size";
      eSizeEl.textContent = em.size;
      eMetaRow.appendChild(eSizeEl);

      eCard.appendChild(eMetaRow);

      var eDescEl = document.createElement("span");
      eDescEl.className = "install-model-desc";
      eDescEl.textContent = em.description;
      eCard.appendChild(eDescEl);

      var eNoteEl = document.createElement("span");
      eNoteEl.className = "install-model-note";
      if (!em.compatible) {
        eNoteEl.textContent =
          "Needs ~" + em.minRamGB + " GB RAM — not enough free memory";
      } else {
        eNoteEl.textContent = "Utility model — not used as main assistant";
      }
      eCard.appendChild(eNoteEl);

      if (em.compatible) {
        eCard.addEventListener(
          "click",
          (function (mid, mname) {
            return function () {
              startModelDownload(mid, mname, "model");
            };
          })(em.id, em.name),
        );
      }

      installModelList.appendChild(eCard);
    }
  }
}

async function openModelPicker() {
  installSubtitle.textContent = "Choose a model to download";
  installTitle.textContent = "Change Model";
  installBack.classList.remove("hidden");
  installAvatar.classList.add("hidden");
  installSpinner.classList.add("hidden");
  installProgressBar.classList.add("hidden");
  installPct.classList.add("hidden");
  installSize.classList.add("hidden");
  installScreen.classList.remove("hidden");
  chatPanel.classList.add("hidden");

  isSetupScreen = false;
  window.electronAPI.resizeWindow(340, 580);

  var sysInfo = await window.electronAPI.getSystemInfo();
  var allModels = await window.electronAPI.getRecommendedModels();
  var compatModels = await window.electronAPI.getCompatibleModels();
  var extraModels = await window.electronAPI.getExtraModels();

  try {
    var saved = await window.electronAPI.getConfig();
    if (saved && saved.gpuLayers != null) {
      selectedBackend = saved.gpuLayers === "max" ? "gpu" : "cpu";
    }
  } catch (_) {}

  renderModelPicker(allModels, compatModels, sysInfo, extraModels);
}

function closeModelPicker() {
  installBack.classList.add("hidden");
  installAvatar.classList.remove("hidden");
  installPct.classList.remove("hidden");
  installSize.classList.remove("hidden");
  installScreen.classList.add("hidden");
  chatPanel.classList.remove("hidden");
  sendBtn.classList.remove("hidden");
  window.electronAPI.resizeWindow(400, 550);
}

async function startModelDownload(modelId, modelName, isExtra) {
  installModelList.innerHTML = "";
  installSpinner.classList.remove("hidden");
  installProgressBar.classList.remove("hidden");
  installSubtitle.textContent = "Downloading " + modelName + "...";
  installProgressFill.style.width = "0%";
  installPct.textContent = "0%";
  installSize.textContent = "";

  while (true) {
    var result = await window.electronAPI.downloadModel(modelId);

    if (result.ok) break;

    installSubtitle.textContent =
      "Download failed: " +
      (result.error || "Unknown error") +
      ". Retrying in 3s...";
    await new Promise(function (r) {
      return setTimeout(r, 3000);
    });
    installSubtitle.textContent = "Downloading " + modelName + "...";
  }

  if (isExtra === "model") {
    openModelPicker();
    return;
  }
  if (isExtra === "addons") {
    addonsPanel.classList.remove("hidden");
    renderAddonModels();
    return;
  }

  var config = {
    modelPath: result.path,
    gpuLayers: selectedBackend === "gpu" ? "max" : 0,
  };
  await window.electronAPI.saveConfig(config);

  installScreen.classList.add("hidden");
  chatPanel.classList.remove("hidden");
  sendBtn.classList.remove("hidden");
  chatOpen = true;
  window.electronAPI.resizeWindow(400, 550);

  setTimeout(function () {
    chatInput.focus();
    smoothScroll(chatMessages);
  }, 150);
}

async function sendMessage() {
  if (isProcessing) return;
  var userText = chatInput.value.trim();
  if (!userText && !currentAttachment) return;

  var result = consumeAttachment(userText);
  if (!result.display) return;

  var display = result.display;
  var attachmentData = result.attachmentData;

  ensureCurrentChat();
  await addMessage(display, "user", attachmentData);
  chatInput.value = "";
  chatInput.style.height = "auto";

  var chat = getCurrentChat();
  var userMsg = { role: "user", content: display };
  if (attachmentData) userMsg.attachment = attachmentData;
  if (chat) {
    if (chat.messages.length === 0) autoNameChat(chat, userText);
    chat.messages.push(userMsg);
    chat.updatedAt = Date.now();
    saveCurrentChat();
  }

  var conversation = chat
    ? chat.messages.map(expandAttachment)
    : [expandAttachment(userMsg)];
  showTyping();

  var msgEl = null;
  var bubble = null;
  var thinkingContent = null;
  var thinkingBlock = null;
  var responseContent = null;
  var buffer = "";
  var thinkingBuf = "";
  var toolCalls = [];
  var docStreamBuf = "";
  var docStreamCard = null;
  var docStreamBody = null;
  webSources = [];

  sendBtn.classList.add("hidden");
  cancelBtn.classList.remove("hidden");
  isProcessing = true;
  chatInput.disabled = true;
  sendBtn.disabled = true;
  responseStartTime = Date.now();

  const cleanup = window.electronAPI.onLLMChunk(function (chunk) {
    // Trace every chunk for debugging tool display timing.
    if (chunk.tool_start) console.log("[renderer] chunk.tool_start:", chunk.tool_start.name, performance.now().toFixed(0) + "ms");
    if (chunk.tool_end) console.log("[renderer] chunk.tool_end:", chunk.tool_end.name, performance.now().toFixed(0) + "ms");
    if (chunk.done || chunk.error) {
      sendBtn.classList.remove("hidden");
      cancelBtn.classList.add("hidden");
      isProcessing = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
    }
    if (
      !msgEl &&
      (chunk.text ||
        chunk.thinking ||
        chunk.replaceText !== undefined ||
        chunk.error ||
        chunk.done)
    ) {
      hideTyping();
      var el = createAssistantMessage();
      msgEl = el;
      bubble = el.querySelector(".bubble");
      thinkingContent = el.querySelector(".thinking-content");
      thinkingBlock = el.querySelector(".thinking-block");
      responseContent = el.querySelector(".response-content");
    }

    if (chunk.error) {
      cleanup();
      setAvatarState("idle");
      isProcessing = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      if (msgEl) {
        msgEl.classList.remove("streaming");
        var wi = bubble.querySelector(".working-indicator");
        if (wi) {
          clearInterval(wi._dotsInterval);
          wi.classList.add("hidden");
        }
        responseContent.textContent = "Error: " + chunk.error;
      }
      var chat = getCurrentChat();
      if (chat) {
        var errMsg = { role: "assistant", content: "Error: " + chunk.error, durationMs: Date.now() - responseStartTime };
        if (buffer) errMsg.content = buffer + "\n\n[Error: " + chunk.error + "]";
        if (thinkingBuf) errMsg.thinking = thinkingBuf;
        if (toolCalls.length > 0) errMsg.tools = toolCalls;
        chat.messages.push(errMsg);
        chat.updatedAt = Date.now();
        saveCurrentChat();
      }
      return;
    }

    if (chunk.done) {
      cleanup();
      setAvatarState("idle");
      isProcessing = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      msgEl.classList.remove("streaming");
      var wi = bubble.querySelector(".working-indicator");
      if (wi) {
        clearInterval(wi._dotsInterval);
        wi.classList.add("hidden");
      }
      if (!thinkingBlock.classList.contains("has-thinking")) {
        thinkingBlock.classList.add("hidden");
      } else {
        setTimeout(function () {
          thinkingBlock.classList.add("collapsed");
        }, 600);
      }

      // Collapse all tool blocks into a clickable summary at the top.
      var toolBlocks = bubble.querySelectorAll(".tool-block");
      if (toolBlocks.length > 0) {
        var summary = document.createElement("div");
        summary.className = "tools-summary";
        var names = [];
        toolBlocks.forEach(function (tb) {
          var h = tb.querySelector(".tool-header");
          names.push(h ? h.textContent.trim() : "tool");
        });
        summary.innerHTML = iconSvg("terminal", 12) + " " + toolBlocks.length + " tool" + (toolBlocks.length !== 1 ? "s" : "") + " used";
        summary.title = names.join("\n");

        var container = document.createElement("div");
        container.className = "tools-container hidden";
        toolBlocks.forEach(function (tb) {
          container.appendChild(tb);
        });

        summary.addEventListener("click", function () {
          container.classList.toggle("hidden");
          summary.classList.toggle("expanded");
        });

        bubble.insertBefore(container, bubble.firstChild);
        bubble.insertBefore(summary, container);
      }

      var chat = getCurrentChat();
      var sourcesToRender = webSources.slice();
      webSources = [];
      var savedFiles = toolFilePaths.slice();
      toolFilePaths = [];
      if (chat) {
        var msgData = { role: "assistant", content: buffer, durationMs: Date.now() - responseStartTime };
        if (thinkingBuf) msgData.thinking = thinkingBuf;
        if (toolCalls.length > 0) msgData.tools = toolCalls;
        if (sourcesToRender.length > 0) msgData.sources = sourcesToRender;
        if (savedFiles.length > 0) msgData.files = savedFiles;
        chat.messages.push(msgData);
        chat.updatedAt = Date.now();
        saveCurrentChat();
      }
      if (sourcesToRender.length > 0) {
        renderCitations(bubble, sourcesToRender);
      }

      renderResponseFooter(bubble, msgData ? msgData.durationMs : 0);
      return;
    }

    if (chunk.confirm_prompt) {
      confirmCommand.textContent = chunk.confirm_prompt.command;
      confirmOverlay.classList.remove("hidden");
      return;
    }

    if (chunk.sudo_prompt) {
      sudoStatus.textContent = "";
      sudoInput.value = "";
      sudoOverlay.classList.remove("hidden");
      setTimeout(function () {
        sudoInput.focus();
      }, 100);
      return;
    }

    if (chunk.captcha_prompt) {
      captchaOverlay.classList.remove("hidden");
      return;
    }

    if (chunk.tool_generating) {
      if (!msgEl) {
        hideTyping();
        msgEl = createAssistantMessage();
        bubble = msgEl.querySelector(".bubble");
        thinkingContent = msgEl.querySelector(".thinking-content");
        thinkingBlock = msgEl.querySelector(".thinking-block");
        responseContent = msgEl.querySelector(".response-content");
      }
      var wi = bubble.querySelector(".working-indicator");
      if (wi) {
        wi.classList.remove("hidden");
        var wt = wi.querySelector(".working-text");
        if (wt) wt.textContent = typeof chunk.tool_generating === "string" ? chunk.tool_generating : "Generating tool call";
      }
      return;
    }

    if (chunk.tool_start) {
      console.log("[renderer] tool_start received:", chunk.tool_start.name);
      if (!msgEl) {
        hideTyping();
        var el = createAssistantMessage();
        msgEl = el;
        bubble = el.querySelector(".bubble");
        thinkingContent = el.querySelector(".thinking-content");
        thinkingBlock = el.querySelector(".thinking-block");
        responseContent = el.querySelector(".response-content");
      }
      var toolName = chunk.tool_start.name;
      toolCalls.push({ name: toolName, args: chunk.tool_start.args || {}, output: null });
      if (toolName === "math") { setAvatarState("talking"); } else if (toolName === "search_web") {
        setAvatarState("search");
      } else {
        setAvatarState("bash");
      }
      var args = chunk.tool_start.args || {};
      var toolBlock = document.createElement("div");
      toolBlock.className = "tool-block tool-working";
      toolBlock.dataset.started = Date.now();
      var toolHeader = document.createElement("div");
      toolHeader.className = "tool-header";
      var isFileTool = toolName === "write_file" || toolName === "read_file";
      if (isFileTool) {
        var filePath = args.path || "";
        if (filePath && toolFilePaths.indexOf(filePath) === -1) {
          toolFilePaths.push(filePath);
        }
        toolBlock.classList.add("tool-file");
        toolHeader.innerHTML = iconSvg("file", 14) + " " + filePath;
        toolHeader.addEventListener("click", function () {
          window.electronAPI.openFile(filePath);
        });
      } else if (toolName === "search_web") {
        toolBlock.dataset.toolName = "search_web";
        var query = args.query || "search";
        toolHeader.innerHTML = iconSvg("search", 14) + " " + query;
        toolHeader.addEventListener("click", function () {
          toolBlock.classList.toggle("collapsed");
        });
      } else if (toolName === "ocr_image" || toolName === "extract_webpage") {
        toolBlock.classList.add("tool-scanning");
        var scanLabel = toolName === "ocr_image"
          ? (args.path ? args.path.split("/").pop().split("\\").pop() : "image")
          : (args.url || "webpage");
        toolHeader.innerHTML = iconSvg("search", 14) + " ";
        var scanSpinner = document.createElement("span");
        scanSpinner.className = "tool-scan-spinner";
        toolHeader.appendChild(scanSpinner);
        var scanText = document.createElement("span");
        scanText.className = "tool-scan-label";
        scanText.textContent = "Scanning " + scanLabel + "...";
        toolHeader.appendChild(scanText);
        toolHeader.addEventListener("click", function () {
          toolBlock.classList.toggle("collapsed");
        });
      } else {
        var cmd = args.command || JSON.stringify(args);
        var label = args.command || toolName;
        if (label.length > 50) label = label.slice(0, 50) + "...";
        toolHeader.innerHTML = iconSvg("terminal", 14) + " " + label;
        toolHeader.addEventListener("click", function () {
          toolBlock.classList.toggle("collapsed");
        });
      }
      var toolContent = document.createElement("div");
      toolContent.className = "tool-content";
      if (isFileTool) {
        var filePath = args.path || "";
        var capsule = document.createElement("div");
        capsule.className = "tool-file-capsule";
        capsule.title = "Click to open file";
        capsule.textContent = filePath;
        capsule.addEventListener("click", function () {
          window.electronAPI.openFile(filePath);
        });
        toolContent.appendChild(capsule);
      } else {
        var cmd = args.command || JSON.stringify(args);
        var pre = document.createElement("pre");
        pre.className = "tool-text";
        pre.textContent = cmd;
        toolContent.appendChild(pre);
      }
      toolBlock.appendChild(toolHeader);
      toolBlock.appendChild(toolContent);
      bubble.insertBefore(toolBlock, responseContent);
      console.log("[renderer] tool block inserted for:", toolName, performance.now().toFixed(0) + "ms");
      toolBlock.offsetHeight;
      smoothScroll(chatMessages);
      return;
    }

    if (chunk.tool_end) {
      console.log("[renderer] tool_end received:", chunk.tool_end.name, "bubble:", !!bubble);
      if (!bubble) { console.log("[renderer] tool_end but no bubble — msgEl:", !!msgEl); return; }
      var toolBlocks = bubble.querySelectorAll(".tool-block");
      var tbEnd = toolBlocks[toolBlocks.length - 1];
      if (tbEnd) {
        var tcEnd = tbEnd.querySelector(".tool-content");
        if (tcEnd) {
          var existingOut = tcEnd.querySelector(".tool-output");

          // Extract web sources from search_web results
          if (tbEnd.dataset.toolName === "search_web" && !existingOut) {
            try {
              var results = JSON.parse(chunk.tool_end.output);
              if (Array.isArray(results)) {
                results.forEach(function (r) {
                  if (
                    r.url &&
                    !webSources.some(function (s) {
                      return s.url === r.url;
                    })
                  ) {
                    webSources.push({
                      url: r.url,
                      title: r.title || r.url,
                    });
                  }
                });
              }
            } catch (e) {}
          }

          var outText = stripEmojis(chunk.tool_end.output);
          if (toolCalls.length > 0) {
            toolCalls[toolCalls.length - 1].output = outText;
          }

          if (!existingOut) {
            var out = document.createElement("div");
            out.className = "tool-output";
            var minAnim = 300;
            var elapsed = Date.now() - (parseInt(tbEnd.dataset.started) || 0);
            var delay = Math.max(0, minAnim - elapsed);
            console.log("[renderer] tool output delayed " + delay + "ms for:", chunk.tool_end.name, performance.now().toFixed(0) + "ms");
            setTimeout(function () {
              console.log("[renderer] tool output showing for:", chunk.tool_end.name, performance.now().toFixed(0) + "ms");
              out.textContent = outText;
              tcEnd.appendChild(out);
              tbEnd.classList.remove("tool-working");
            }, delay);
            setTimeout(function () {
              tbEnd.classList.add("collapsed");
            }, delay + 800);
          }

          // Replace scanning animation with result summary for ocr/extract.
          if (tbEnd.classList.contains("tool-scanning")) {
            tbEnd.classList.remove("tool-scanning");
            var scanSpinner = tbEnd.querySelector(".tool-scan-spinner");
            if (scanSpinner) scanSpinner.remove();
            var scanLabel = tbEnd.querySelector(".tool-scan-label");
            if (scanLabel) {
              var outLen = chunk.tool_end.output ? chunk.tool_end.output.length : 0;
              if (outLen > 0) {
                scanLabel.textContent = "Done — " + (outLen < 100 ? chunk.tool_end.output.slice(0, 80) : outLen + " chars extracted");
              } else {
                scanLabel.textContent = "Done — nothing found";
              }
            }
          }
          // Show docx preview card when create_docx finishes.
          if (chunk.tool_end.name === "create_docx") {
            try {
              var docxResult = JSON.parse(chunk.tool_end.output);
              if (docxResult.ok && docxResult.path) {
                renderDocxPreview(bubble, docxResult);
              }
            } catch (_) {}
          }
        }
      }
      smoothScroll(chatMessages);
      return;
    }

    if (chunk.doc_stream_start) {
      if (!msgEl) {
        hideTyping();
        msgEl = createAssistantMessage();
        bubble = msgEl.querySelector(".bubble");
        thinkingContent = msgEl.querySelector(".thinking-content");
        thinkingBlock = msgEl.querySelector(".thinking-block");
        responseContent = msgEl.querySelector(".response-content");
      }
      setAvatarState("talking");
      docStreamBuf = "";
      var dsCard = renderDocStreamCard(bubble, chunk.doc_stream_start);
      docStreamCard = dsCard;
      docStreamBody = dsCard.querySelector(".doc-stream-body");
      return;
    }

    if (chunk.doc_stream_chunk) {
      docStreamBuf += chunk.doc_stream_chunk;
      if (docStreamBody) {
        docStreamBody.textContent = docStreamBuf.slice(-3000);
        docStreamBody.scrollTop = docStreamBody.scrollHeight;
      }
      if (docStreamCard) {
        var spinner = docStreamCard.querySelector(".doc-stream-spinner");
        if (spinner) spinner.remove();
        var dsLabel = docStreamCard.querySelector(".doc-stream-label");
        if (dsLabel) dsLabel.textContent = " Writing document...";
      }
      smoothScroll(chatMessages);
      return;
    }

    if (chunk.doc_status) {
      if (docStreamCard) {
        var dsLabel2 = docStreamCard.querySelector(".doc-stream-label");
        if (dsLabel2) dsLabel2.textContent = " " + chunk.doc_status;
      }
      return;
    }

    if (chunk.doc_stream_end) {
      if (docStreamCard) {
        docStreamCard.classList.add("doc-stream-done");
        var dsHeader = docStreamCard.querySelector(".doc-stream-header");
        if (dsHeader) {
          dsHeader.innerHTML = iconSvg("file", 16) + " Document ready";
        }
      }
      docStreamCard = null;
      docStreamBody = null;
      return;
    }

    if (chunk.thinking) {
      setAvatarState("thinking");
      thinkingBuf += chunk.thinking;
      thinkingBlock.classList.remove("hidden");
      thinkingBlock.classList.add("has-thinking");
      thinkingContent.textContent = thinkingBuf;
      thinkingBlock.classList.remove("collapsed");
      smoothScroll(chatMessages);
    }

    if (chunk.replaceText !== undefined) {
      setAvatarState("talking");
      buffer = stripEmojis(chunk.replaceText);
      renderStreamedContent(
        bubble,
        buffer,
        thinkingBlock,
        thinkingContent,
        responseContent,
      );
    } else if (chunk.text) {
      setAvatarState("talking");
      buffer += stripEmojis(chunk.text);
      renderStreamedContent(
        bubble,
        buffer,
        thinkingBlock,
        thinkingContent,
        responseContent,
      );
    }
  });

  window.electronAPI.startLLMStream(conversation);
}

function createAssistantMessage() {
  const div = document.createElement("div");
  div.className = "message assistant streaming message-animate";
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  var tb = document.createElement("div");
  tb.className = "thinking-block hidden";
  var th = document.createElement("div");
  th.className = "thinking-header";
  th.innerHTML = iconSvg("brain", 14) + " Thinking";
  th.addEventListener("click", function () {
    tb.classList.toggle("collapsed");
  });
  var tc = document.createElement("div");
  tc.className = "thinking-content";
  tb.appendChild(th);
  tb.appendChild(tc);

  const rc = document.createElement("div");
  rc.className = "response-content";

  var wi = document.createElement("div");
  wi.className = "working-indicator";
  var wiText = document.createElement("span");
  wiText.className = "working-text";
  wiText.textContent = "Working";
  var wiDots = document.createElement("span");
  wiDots.className = "working-dots";
  wiDots.textContent = "...";
  wi.appendChild(wiText);
  wi.appendChild(wiDots);

  // Animate the dots cycling
  var dotCount = 0;
  wi._dotsInterval = setInterval(function () {
    dotCount = (dotCount + 1) % 4;
    wiDots.textContent = ".".repeat(dotCount);
  }, 400);
  if (wi._dotsInterval.unref) wi._dotsInterval.unref();

  bubble.appendChild(tb);
  bubble.appendChild(rc);
  bubble.appendChild(wi);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  smoothScroll(chatMessages);

  return div;
}

function parseBuffer(buffer) {
  var openTag = "<think>";
  var closeTag = "</think>";

  // Strip all think blocks, collecting their content
  var thinkingParts = [];
  var cleaned = buffer;
  var found = false;
  var stillOpen = false;

  while (true) {
    var openIdx = cleaned.indexOf(openTag);
    if (openIdx === -1) break;

    var closeIdx = cleaned.indexOf(closeTag, openIdx + openTag.length);
    if (closeIdx === -1) {
      thinkingParts.push(cleaned.slice(openIdx + openTag.length));
      cleaned = cleaned.slice(0, openIdx);
      stillOpen = true;
      found = true;
      break;
    }

    thinkingParts.push(cleaned.slice(openIdx + openTag.length, closeIdx));
    cleaned = cleaned.slice(0, openIdx) + cleaned.slice(closeIdx + closeTag.length);
    found = true;
  }

  return {
    thinking: thinkingParts.join("\n"),
    response: cleaned,
    inThinking: stillOpen,
    hasThinking: found,
  };
}

async function renderStreamedContent(
  bubble,
  buffer,
  thinkingBlock,
  thinkingContent,
  responseContent,
) {
  var parsed = parseBuffer(buffer);

  if (parsed.hasThinking) {
    thinkingBlock.classList.remove("hidden");
    thinkingBlock.classList.add("has-thinking");
    thinkingContent.textContent = parsed.thinking;
    thinkingBlock.classList.remove("collapsed");
  }

  responseContent.innerHTML = parsed.response
    ? await processMathInHtml(await window.electronAPI.parseMarkdown(parsed.response))
    : "";

  if (toolFilePaths.length > 0) {
    linkifyFilePaths(responseContent, toolFilePaths);
  }

  smoothScroll(chatMessages);
}

function linkifyFilePaths(root, paths) {
  var walker = root.ownerDocument.createTreeWalker(
    root,
    4, // NodeFilter.SHOW_TEXT
    null,
    false,
  );
  var nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var text = node.textContent;

    // Find all path occurrences
    var matches = [];
    for (var p = 0; p < paths.length; p++) {
      var idx = text.indexOf(paths[p]);
      if (idx !== -1) {
        matches.push({ path: paths[p], index: idx, length: paths[p].length });
      }
    }
    if (matches.length === 0) continue;

    // Sort by position, prefer longer match at same position
    matches.sort(function (a, b) {
      if (a.index !== b.index) return a.index - b.index;
      return b.length - a.length;
    });

    var doc = node.ownerDocument;
    var fragment = doc.createDocumentFragment();
    var lastEnd = 0;
    for (var m = 0; m < matches.length; m++) {
      if (matches[m].index < lastEnd) continue; // skip overlapping
      if (matches[m].index > lastEnd) {
        fragment.appendChild(
          doc.createTextNode(text.slice(lastEnd, matches[m].index)),
        );
      }
      var link = doc.createElement("a");
      link.className = "file-link";
      link.href = "#";
      link.title = "Open " + matches[m].path;
      link.textContent = matches[m].path;
      link.addEventListener(
        "click",
        (function (fp) {
          return function (e) {
            e.preventDefault();
            window.electronAPI.openFile(fp);
          };
        })(matches[m].path),
      );
      fragment.appendChild(link);
      lastEnd = matches[m].index + matches[m].length;
    }
    if (lastEnd < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(lastEnd)));
    }

    node.parentNode.replaceChild(fragment, node);
  }
}

function smoothScroll(el) {
  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
}

function showTyping() {
  typingIndicator.classList.remove("hidden");
  smoothScroll(chatMessages);
  setAvatarState("thinking");
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
  setAvatarState("idle");
}

function stripEmojis(text) {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{2B50}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FB}-\u{25FE}\u{25FC}\u{25FD}\u{2B1B}\u{2B1C}\u{2B55}]/gu,
      "",
    )
    .replace(/\*\*([\s\S]*?)\*\*/g, function (_, content) {
      return "**" + content.trim() + "**";
    })
    .replace(/(^|\s)\*([^*]+?)\*(\s|$)/g, function (_, pre, content, post) {
      return pre + "*" + content.trim() + "*" + post;
    })
    .replace(/ {2,}/g, " ");
}

var SUGGESTIONS = [
  "What can you do?",
  "Check my system",
  "Search the web",
  "Create a file",
  "List my packages",
  "Check disk usage",
];

function renderEmptyState() {
  var existing = document.getElementById("chat-empty-state");
  if (existing) return;
  if (chatMessages.querySelector(".message")) return;

  var el = document.createElement("div");
  el.id = "chat-empty-state";

  var title = document.createElement("div");
  title.className = "empty-title";
  title.textContent = "Ask me anything";

  var desc = document.createElement("div");
  desc.className = "empty-desc";
  desc.textContent = "I can answer questions, run commands, search the web, and more.";

  var chips = document.createElement("div");
  chips.className = "empty-suggestions";

  SUGGESTIONS.forEach(function (s) {
    var chip = document.createElement("span");
    chip.className = "empty-suggestion";
    chip.textContent = s;
    chip.addEventListener("click", function () {
      chatInput.value = s;
      chatInput.focus();
      autoResizeTextarea();
      sendMessage();
    });
    chips.appendChild(chip);
  });

  el.appendChild(title);
  el.appendChild(desc);
  el.appendChild(chips);
  chatMessages.appendChild(el);
}

function removeEmptyState() {
  var el = document.getElementById("chat-empty-state");
  if (el) el.remove();
}

async function addMessage(text, role, attachment) {
  var durationMs = null;
  if (typeof text === "object" && text !== null && text.role) {
    var msg = text;
    durationMs = msg.durationMs;
    if (msg.role === "assistant" && (msg.tools || msg.thinking || msg.sources || msg.files)) {
      renderStructuredMessage(msg);
      return;
    }
    role = msg.role;
    attachment = msg.attachment;
    text = msg.content;
  }

  removeEmptyState();
  const div = document.createElement("div");
  div.className = "message " + role + " message-animate";

  if (attachment && attachment.name) {
    var attachmentLabel = document.createElement("div");
    attachmentLabel.className = "message-attachment-label";
    attachmentLabel.innerHTML =
      iconSvg("paperclip", 12) + " " + attachment.name;
    attachmentLabel.title = attachment.path || attachment.name;
    if (attachment.path) {
      attachmentLabel.style.cursor = "pointer";
      attachmentLabel.addEventListener("click", function () {
        window.electronAPI.openFile(attachment.path);
      });
    }
    div.appendChild(attachmentLabel);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  div.appendChild(bubble);
  chatMessages.appendChild(div);

  await renderContent(bubble, text);

  if (role === "assistant") {
    renderResponseFooter(bubble, durationMs != null ? durationMs : 0);
  }

  requestAnimationFrame(function () {
    smoothScroll(chatMessages);
  });
}

function renderStructuredMessage(msg) {
  removeEmptyState();
  var el = createAssistantMessage();
  var bubble = el.querySelector(".bubble");
  var thinkingContent = el.querySelector(".thinking-content");
  var thinkingBlock = el.querySelector(".thinking-block");
  var responseContent = el.querySelector(".response-content");
  var wi = bubble.querySelector(".working-indicator");
  if (wi) { clearInterval(wi._dotsInterval); wi.classList.add("hidden"); }

  el.classList.remove("streaming");

  // Restore thinking block
  if (msg.thinking) {
    thinkingContent.textContent = msg.thinking;
    thinkingBlock.classList.remove("hidden");
    thinkingBlock.classList.add("has-thinking");
    thinkingBlock.classList.add("collapsed");
  } else {
    thinkingBlock.classList.add("hidden");
  }

  // Render response text — strip thinking tags and duplicated thinking text
  var contentResp = msg.content || "";
  var parsed = parseBuffer(contentResp);
  var cleanResponse = parsed.response;

  if (msg.thinking && cleanResponse.indexOf(msg.thinking) === 0) {
    cleanResponse = cleanResponse.slice(msg.thinking.length).replace(/^\s+/, "");
  }

  renderContent(responseContent, cleanResponse);

  // Restore tool calls
  if (msg.tools && msg.tools.length > 0) {
    msg.tools.forEach(function (tool) {
      var tb = document.createElement("div");
      tb.className = "tool-block";
      var th = document.createElement("div");
      th.className = "tool-header";
      th.addEventListener("click", function () {
        tb.classList.toggle("collapsed");
      });

      var args = tool.args || {};
      var isFileTool = tool.name === "write_file" || tool.name === "read_file";

      if (isFileTool) {
        var fp = args.path || "";
        tb.classList.add("tool-file");
        th.innerHTML = iconSvg("file", 14) + " " + fp;
        th.addEventListener("click", function () {
          window.electronAPI.openFile(fp);
        });
      } else if (tool.name === "search_web") {
        var query = args.query || "search";
        th.innerHTML = iconSvg("search", 14) + " " + query;
      } else {
        var label = args.command || tool.name;
        if (label.length > 50) label = label.slice(0, 50) + "...";
        th.innerHTML = iconSvg("terminal", 14) + " " + label;
      }

      var tc = document.createElement("div");
      tc.className = "tool-content";

      if (isFileTool) {
        var cap = document.createElement("div");
        cap.className = "tool-file-capsule";
        cap.textContent = args.path || "";
        cap.addEventListener("click", function () {
          window.electronAPI.openFile(args.path);
        });
        tc.appendChild(cap);
      } else {
        var pre = document.createElement("pre");
        pre.className = "tool-text";
        pre.textContent = args.command || JSON.stringify(args);
        tc.appendChild(pre);
      }

      if (tool.output) {
        var out = document.createElement("div");
        out.className = "tool-output";
        out.textContent = tool.output;
        tc.appendChild(out);
      }

      tb.appendChild(th);
      tb.appendChild(tc);
      bubble.insertBefore(tb, responseContent);
    });

    // Collapse tool blocks into a summary
    var toolBlocks = bubble.querySelectorAll(".tool-block");
    var summary = document.createElement("div");
    summary.className = "tools-summary";
    summary.innerHTML = iconSvg("terminal", 12) + " " + toolBlocks.length + " tool" + (toolBlocks.length !== 1 ? "s" : "") + " used";

    var container = document.createElement("div");
    container.className = "tools-container hidden";
    toolBlocks.forEach(function (tb) { container.appendChild(tb); });

    summary.addEventListener("click", function () {
      container.classList.toggle("hidden");
      summary.classList.toggle("expanded");
    });

    bubble.insertBefore(container, responseContent);
    bubble.insertBefore(summary, container);
  }

  // Restore web sources
  if (msg.sources && msg.sources.length > 0) {
    renderCitations(bubble, msg.sources);
  }

  // Restore file paths as clickable links in the response text
  if (msg.files && msg.files.length > 0) {
    linkifyFilePaths(responseContent, msg.files);
  }

  renderResponseFooter(bubble, msg.durationMs || 0);
  requestAnimationFrame(function () {
    smoothScroll(chatMessages);
  });
}


async function processMathInHtml(html) {
  if (!html) return html;

  var displayPattern = /\$\$([\s\S]*?)\$\$/g;
  var inlinePattern = /(?<!\\)\$(?!\$)([^\$\n]+?)(?<!\\)\$/g;

  // Replace display math $...$
  var displayMatches = [];
  var m;
  while ((m = displayPattern.exec(html)) !== null) {
    displayMatches.push({ match: m[0], tex: m[1], index: m.index });
  }

  for (var i = displayMatches.length - 1; i >= 0; i--) {
    var dm = displayMatches[i];
    try {
      var rendered = await window.electronAPI.renderMath(dm.tex, true);
      html = html.substring(0, dm.index) + rendered + html.substring(dm.index + dm.match.length);
    } catch (e) {
      html = html.substring(0, dm.index) +
        '<span class="math-block-fallback">' + dm.tex + "</span>" +
        html.substring(dm.index + dm.match.length);
    }
  }

  // Replace inline math $...$ (after display math is done, to avoid re-matching)
  displayPattern.lastIndex = 0;
  var inlineMatches = [];
  while ((m = inlinePattern.exec(html)) !== null) {
    inlineMatches.push({ match: m[0], tex: m[1], index: m.index });
  }

  for (var j = inlineMatches.length - 1; j >= 0; j--) {
    var im = inlineMatches[j];
    try {
      rendered = await window.electronAPI.renderMath(im.tex, false);
      html = html.substring(0, im.index) + rendered + html.substring(im.index + im.match.length);
    } catch (e) {
      html = html.substring(0, im.index) +
        '<span class="math-inline-fallback">' + im.tex + "</span>" +
        html.substring(im.index + im.match.length);
    }
  }

  return html;
}

async function renderContent(el, text) {
  try {
    var parsed = parseBuffer(text);
    var html = await window.electronAPI.parseMarkdown(parsed.response);
    html = await processMathInHtml(html);
    el.innerHTML = html;
  } catch (e) {
    el.textContent = text;
  }
}

function renderCitations(bubble, sources) {
  var citationsContainer = document.createElement("div");
  citationsContainer.className = "citations-container collapsed";

  var citationsLabel = document.createElement("div");
  citationsLabel.className = "citations-label";
  citationsLabel.innerHTML = iconSvg("globe", 14) + " Sources";
  citationsLabel.addEventListener("click", function () {
    citationsContainer.classList.toggle("collapsed");
  });
  citationsContainer.appendChild(citationsLabel);

  var citationsList = document.createElement("div");
  citationsList.className = "citations-list";

  sources.forEach(function (source, index) {
    var citation = document.createElement("a");
    citation.className = "citation-item";
    citation.href = source.url;
    citation.target = "_blank";
    citation.rel = "noopener noreferrer";

    var favicon = document.createElement("img");
    favicon.className = "citation-favicon";
    favicon.src = getFaviconUrl(source.url);
    favicon.alt = "";
    favicon.width = 16;
    favicon.height = 16;

    var title = document.createElement("span");
    title.className = "citation-title";
    title.textContent = getDomain(source.url);
    title.title = source.title || source.url;

    citation.appendChild(favicon);
    citation.appendChild(title);

    // When collapsed, only show first 4 sources; show + indicator if more
    if (index >= 4) {
      citation.classList.add("citation-item-extra");
    }

    citationsList.appendChild(citation);
  });

  // Add + indicator if more than 4 sources
  if (sources.length > 4) {
    var moreIndicator = document.createElement("span");
    moreIndicator.className = "citation-more";
    moreIndicator.textContent = "+" + (sources.length - 4);
    citationsList.appendChild(moreIndicator);
  }

  citationsContainer.appendChild(citationsList);
  bubble.appendChild(citationsContainer);
}

function renderDocStreamCard(bubble, info) {
  var card = document.createElement("div");
  card.className = "doc-stream-card";

  var header = document.createElement("div");
  header.className = "doc-stream-header";

  var spinner = document.createElement("span");
  spinner.className = "doc-stream-spinner";
  header.appendChild(spinner);

  var label = document.createElement("span");
  label.className = "doc-stream-label";
  label.textContent = " Generating document: " + escapeHtml(info.filename || "document") + ".docx";
  header.appendChild(label);

  var body = document.createElement("div");
  body.className = "doc-stream-body";
  body.textContent = "Starting...";

  card.appendChild(header);
  card.appendChild(body);
  bubble.appendChild(card);
  return card;
}

function renderDocxPreview(bubble, result) {
  // Guard against duplicates.
  if (bubble.querySelector(".docx-preview-card")) return;

  var card = document.createElement("div");
  card.className = "docx-preview-card";

  var header = document.createElement("div");
  header.className = "docx-preview-header";
  header.innerHTML = iconSvg("file", 16) + " <strong>" + escapeHtml(result.filename) + "</strong>";

  var size = document.createElement("span");
  size.className = "docx-preview-size";
  var kb = (result.size / 1024).toFixed(1);
  size.textContent = kb + " KB";
  header.appendChild(size);

  var actions = document.createElement("div");
  actions.className = "docx-preview-actions";

  var downloadBtn = document.createElement("button");
  downloadBtn.className = "docx-download-btn";
  downloadBtn.innerHTML = iconSvg("download", 14) + " Download";
  downloadBtn.addEventListener("click", function () {
    window.electronAPI.saveFileAs(result.path, result.filename);
  });

  var openBtn = document.createElement("button");
  openBtn.className = "docx-download-btn";
  openBtn.innerHTML = iconSvg("external", 14) + " Open";
  openBtn.addEventListener("click", function () {
    window.electronAPI.openFile(result.path);
  });

  actions.appendChild(downloadBtn);
  actions.appendChild(openBtn);

  card.appendChild(header);
  card.appendChild(actions);
  bubble.appendChild(card);
}

function renderResponseFooter(bubble, durationMs) {
  if (bubble.querySelector(".response-footer")) return;

  var elapsed = durationMs || (Date.now() - responseStartTime);
  var seconds = (elapsed / 1000).toFixed(1);

  var footer = document.createElement("div");
  footer.className = "response-footer";

  var parts = [];
  if (modelInfo.name) parts.push(modelInfo.name);
  parts.push(modelInfo.backend);
  parts.push(seconds + "s");

  footer.textContent = parts.join(" · ");
  bubble.appendChild(footer);
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getFaviconUrl(url) {
  var domain = getDomain(url);
  return (
    "https://www.google.com/s2/favicons?domain=" +
    encodeURIComponent(domain) +
    "&sz=16"
  );
}

function getDomain(url) {
  try {
    var hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}

var visionProgress = document.getElementById("vision-progress");
var visionProgressLabel = document.getElementById("vision-progress-label");
var visionProgressPct = document.getElementById("vision-progress-pct");
var visionProgressFill = document.getElementById("vision-progress-fill");
var visionProgressTimer = null;

window.electronAPI.onVisionProgress(function (info) {
  if (!info) return;

  if (visionProgressTimer) {
    clearTimeout(visionProgressTimer);
    visionProgressTimer = null;
  }

  visionProgress.classList.remove("hidden");

  var pct = info.percent;
  if (pct != null) {
    visionProgressFill.style.width = Math.min(100, Math.max(0, pct)) + "%";
    visionProgressPct.textContent = pct + "%";
  }

  var status = info.status;
  if (status === "error" || (typeof status === "string" && status.indexOf("failed") !== -1)) {
    visionProgressLabel.textContent = (typeof status === "string" && status !== "error") ? status : "Vision model failed to load";
  } else if (
    (pct != null && pct >= 100) ||
    status === "done" ||
    status === "ready"
  ) {
    visionProgressFill.style.width = "100%";
    visionProgressPct.textContent = "100%";
    visionProgressLabel.textContent = "Vision model ready";
    visionProgressTimer = setTimeout(function () {
      visionProgress.classList.add("hidden");
    }, 2000);
  } else {
    visionProgressLabel.textContent = "Loading vision model...";
  }
});

window.electronAPI.onApplyTheme(function (properties) {
  if (!properties || typeof properties !== "object") return;
  var root = document.documentElement;
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      root.style.setProperty(key, properties[key]);
    }
  }
});

function autoResizeTextarea() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + "px";
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
chatInput.addEventListener("input", autoResizeTextarea);
