const avatar = document.getElementById("avatar");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatListPanel = document.getElementById("chat-list-panel");
const chatListBody = document.getElementById("chat-list-body");
const cancelBtn = document.getElementById("cancel-btn");
const chatEffort = document.getElementById("chat-effort");
const chatModel = document.getElementById("chat-model");
const typingIndicator = document.getElementById("typing-indicator");
const setupPanel = document.getElementById("setup-panel");
const setupProvider = document.getElementById("setup-provider");
const setupKey = document.getElementById("setup-key");
const setupEndpoint = document.getElementById("setup-endpoint");
const setupModel = document.getElementById("setup-model");
const setupSave = document.getElementById("setup-save");
const setupStatus = document.getElementById("setup-status");
const closeSetupBtn = document.getElementById("close-setup");
const settingsMenuPanel = document.getElementById("settings-menu-panel");
const themePanel = document.getElementById("theme-panel");
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
const avatarInner = document.getElementById("avatar-inner");
const attachMenu = document.getElementById("attach-menu");
const attachBtn = document.getElementById("attach-btn");
const attachmentPreview = document.getElementById("attachment-preview");
const attachmentName = document.getElementById("attachment-name");
const removeAttachment = document.getElementById("remove-attachment");

avatarInner.src = window.electronAPI.buddyArt("idle");
document.getElementById("close-setup").innerHTML = iconSvg("close", 16);
document.getElementById("close-settings-menu").innerHTML = iconSvg("close", 16);
document.getElementById("close-theme").innerHTML = iconSvg("close", 16);
document.getElementById("send-btn").innerHTML = iconSvg("send", 16);
document.getElementById("cancel-btn").innerHTML = iconSvg("close", 16);
document.getElementById("burger-btn").innerHTML = iconSvg("menu", 18);
document.getElementById("close-chat-list").innerHTML = iconSvg("close", 16);
attachBtn.innerHTML = iconSvg("paperclip", 16);
removeAttachment.innerHTML = iconSvg("close", 14);

let currentAttachment = null;
let attachmentToken = 0;

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
  attachmentName.textContent =
    currentAttachment.label || currentAttachment.name;
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
      label: "Attachment failed",
      status: "error",
      error: e.message || "Could not read attachment.",
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
      label: "Screenshot failed",
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

let chatOpen = false;
let isDragging = false;
let didDrag = false;
let dragStartX = 0;
let dragStartY = 0;
let conversation = [];
let needsSetup = true;

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

function saveChatsToStore() {
  var toSave = chats.map(function (c) {
    return {
      id: c.id,
      name: c.name || "Chat",
      messages: c.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || Date.now(),
    };
  });
  window.electronAPI.saveChats(toSave);
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
    nameSpan.textContent = chat.name + (preview ? ": " + preview : "");

    var delBtn = document.createElement("button");
    delBtn.className = "chat-list-del";
    delBtn.innerHTML = iconSvg("close", 12);
    delBtn.title = "Delete";

    delBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (chats.length <= 1) return;
      chats = chats.filter(function (c) {
        return c.id !== chat.id;
      });
      if (currentChatId === chat.id) {
        switchToChat(chats[0].id);
      }
      renderChatList();
      saveChatsToStore();
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
    name: "Chat " + (chats.length + 1),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  chats.push(chat);
  saveChatsToStore();
  return chat.id;
}

function switchToChat(chatId) {
  if (chatId === currentChatId) return;
  currentChatId = chatId;

  sendBtn.classList.remove("hidden");
  cancelBtn.classList.add("hidden");

  chatMessages.querySelectorAll(".message").forEach(function (el) {
    el.remove();
  });

  var chat = getCurrentChat();
  if (chat) {
    for (var m of chat.messages) {
      addMessage(m.content, m.role, m.attachment);
    }
    requestAnimationFrame(function () {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

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

window.electronAPI.loadChats().then(function (loaded) {
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
    for (var m of chats[0].messages || []) {
      addMessage(m.content, m.role, m.attachment);
    }
    requestAnimationFrame(function () {
      chatMessages.scrollTop = chatMessages.scrollHeight;
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

const providerDefaults = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1",
    model: "gpt-4o-mini",
  },
  openai: {
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  ollama: {
    endpoint: "http://localhost:11434/v1",
    model: "llama3.2",
  },
  opencode: {
    endpoint: "https://opencode.ai/zen/go/v1",
    model: "",
  },
};

function tryFetchModels() {
  const key = setupKey.value.trim();
  const ep = setupEndpoint.value.trim();
  if (!key || !ep) return;
  setupStatus.textContent = "Fetching models...";
  populateModels({ apiKey: key, endpoint: ep });
}

setupProvider.addEventListener("change", () => {
  const preset = providerDefaults[setupProvider.value];
  if (preset) {
    setupEndpoint.value = preset.endpoint;
  }
  setupModel.innerHTML =
    '<option value="">— enter API key to load models —</option>';
  tryFetchModels();
});

setupKey.addEventListener("blur", tryFetchModels);
setupEndpoint.addEventListener("blur", tryFetchModels);

function togglePanel() {
  chatOpen = !chatOpen;
  if (chatOpen) {
    window.electronAPI.resizeWindow(400, 550);
    if (needsSetup) {
      setupPanel.classList.remove("hidden");
      chatPanel.classList.add("hidden");
    } else {
      chatPanel.classList.remove("hidden");
      setupPanel.classList.add("hidden");
      setTimeout(function () {
        chatInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 150);
    }
  } else {
    chatPanel.classList.add("hidden");
    setupPanel.classList.add("hidden");
    window.electronAPI.resizeWindow(88, 88);
  }
}

setupSave.addEventListener("click", async () => {
  const config = {
    provider: setupProvider.value,
    apiKey: setupKey.value.trim(),
    endpoint: setupEndpoint.value.trim(),
    model: setupModel.value.trim(),
  };

  if (!config.apiKey) {
    setupStatus.textContent = "API key is required.";
    return;
  }
  if (!config.endpoint) {
    setupStatus.textContent = "Endpoint URL is required.";
    return;
  }
  if (!config.model) {
    setupStatus.textContent = "Select a model.";
    return;
  }

  setupSave.disabled = true;
  setupStatus.textContent = "Saving...";

  try {
    await window.electronAPI.saveConfig(config);
    needsSetup = false;
    setupStatus.textContent = "Saved! Restart the chat.";
    setTimeout(() => {
      setupPanel.classList.add("hidden");
      chatPanel.classList.remove("hidden");
      chatOpen = true;
      setTimeout(() => chatInput.focus(), 150);
    }, 600);
  } catch (err) {
    setupStatus.textContent = "Error: " + err.message;
  } finally {
    setupSave.disabled = false;
  }
});

async function populateModels(cfg) {
  try {
    const models = await window.electronAPI.fetchModels(cfg);
    setupModel.innerHTML = '<option value="">— select a model —</option>';
    if (models.length === 0) {
      setupStatus.textContent =
        "No models returned. Check the endpoint and key.";
      return;
    }
    for (const m of models) {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      setupModel.appendChild(opt);
    }
    setupStatus.textContent = `Found ${models.length} models.`;
  } catch (err) {
    setupStatus.textContent = "Failed to fetch models: " + err.message;
  }
}

var chatModelsLoaded = false;

function populateChatModel(current) {
  chatModel.innerHTML = "";
  if (current) {
    var opt = document.createElement("option");
    opt.value = current;
    opt.textContent = current;
    opt.selected = true;
    chatModel.appendChild(opt);
  }
}

async function loadChatModels() {
  if (chatModelsLoaded) return;
  var cfg = await window.electronAPI.getConfig();
  if (!cfg) return;
  try {
    var models = await window.electronAPI.fetchModels(cfg);
    if (models.length === 0) return;
    chatModelsLoaded = true;
    var current = chatModel.value;
    chatModel.innerHTML = "";
    for (var i = 0; i < models.length; i++) {
      var opt = document.createElement("option");
      opt.value = models[i];
      opt.textContent = models[i];
      if (models[i] === current) opt.selected = true;
      chatModel.appendChild(opt);
    }
  } catch (e) {}
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
  setupPanel.classList.add("hidden");
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
    setupPanel.classList.add("hidden");
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

    if (action === "provider") {
      settingsMenuPanel.classList.add("hidden");
      setupPanel.classList.remove("hidden");
      window.electronAPI.getConfig().then(function (cfg) {
        if (cfg) {
          setupProvider.value = cfg.provider || "openrouter";
          setupEndpoint.value = cfg.endpoint || "";
          setupModel.value = cfg.model || "";
        }
      });
      setupStatus.textContent = "Update your provider settings below.";
    } else if (action === "theme") {
      settingsMenuPanel.classList.add("hidden");
      themePanel.classList.remove("hidden");
      renderThemeList();
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

var themeListEl = document.getElementById("theme-list");

function renderThemeList() {
  if (!themeListEl) return;
  themeListEl.innerHTML = "";
  window.electronAPI.loadThemes().then(function (themes) {
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

        var nameSpan = document.createElement("span");
        nameSpan.className = "theme-item-name";
        nameSpan.textContent = names[i];
        item.appendChild(nameSpan);

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

closeSetupBtn.addEventListener("click", () => {
  setupPanel.classList.add("hidden");
  if (needsSetup) {
    chatOpen = false;
    window.electronAPI.resizeWindow(88, 88);
  } else {
    chatPanel.classList.remove("hidden");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!chatListPanel.classList.contains("hidden")) {
      closeChatList();
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

window.electronAPI.hasConfig().then((has) => {
  if (!has) {
    needsSetup = true;
    return;
  }
  needsSetup = false;
  window.electronAPI.getConfig().then(function (cfg) {
    if (cfg && cfg.model) {
      populateChatModel(cfg.model);
    }
    if (cfg && cfg.reasoningEffort) {
      chatEffort.value = cfg.reasoningEffort;
    }
  });
  chatEffort.addEventListener("change", function () {
    window.electronAPI.saveEffort(chatEffort.value || undefined);
  });
  chatModel.addEventListener("change", function () {
    window.electronAPI.saveModel(chatModel.value);
  });
  chatModel.addEventListener("focus", function () {
    loadChatModels();
  });
  window.electronAPI.validateStoredConfig().then((result) => {
    if (!result.valid) {
      needsSetup = true;
      setupStatus.textContent =
        "Stored config is invalid: " + result.error + " — update it below.";
      window.electronAPI.getConfig().then((cfg) => {
        if (cfg) {
          setupProvider.value = cfg.provider || "openrouter";
          setupEndpoint.value = cfg.endpoint || "";
          setupModel.value = cfg.model || "";
        }
      });
    }
  });
});

async function sendMessage() {
  var userText = chatInput.value.trim();
  if (!userText && !currentAttachment) return;

  var result = consumeAttachment(userText);
  if (!result.display) return;

  var display = result.display;
  var attachmentData = result.attachmentData;

  ensureCurrentChat();
  await addMessage(display, "user", attachmentData);
  chatInput.value = "";

  var chat = getCurrentChat();
  var userMsg = { role: "user", content: display };
  if (attachmentData) userMsg.attachment = attachmentData;
  if (chat) {
    chat.messages.push(userMsg);
    chat.updatedAt = Date.now();
    saveChatsToStore();
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

  sendBtn.classList.add("hidden");
  cancelBtn.classList.remove("hidden");

  const cleanup = window.electronAPI.onLLMChunk(function (chunk) {
    if (chunk.done || chunk.error) {
      sendBtn.classList.remove("hidden");
      cancelBtn.classList.add("hidden");
    }
    if (!msgEl && (chunk.text || chunk.thinking || chunk.error || chunk.done)) {
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
      responseContent.textContent = "Error: " + chunk.error;
      msgEl.classList.remove("streaming");
      return;
    }

    if (chunk.done) {
      cleanup();
      setAvatarState("idle");
      msgEl.classList.remove("streaming");
      if (!thinkingBlock.classList.contains("has-thinking")) {
        thinkingBlock.classList.add("hidden");
      } else {
        setTimeout(function () {
          thinkingBlock.classList.add("collapsed");
        }, 600);
      }
      var chat = getCurrentChat();
      if (chat) {
        chat.messages.push({ role: "assistant", content: buffer });
        chat.updatedAt = Date.now();
        saveChatsToStore();
      }
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

    if (chunk.tool_start) {
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
      if (toolName === "search_web") {
        setAvatarState("search");
      } else {
        setAvatarState("bash");
      }
      var cmd =
        chunk.tool_start.args.command || JSON.stringify(chunk.tool_start.args);
      var toolBlock = document.createElement("div");
      toolBlock.className = "tool-block";
      var toolHeader = document.createElement("div");
      toolHeader.className = "tool-header";
      var iconName = "terminal";
      var label = chunk.tool_start.name;
      var args = chunk.tool_start.args || {};
      if (chunk.tool_start.name === "search_web") {
        iconName = "search";
        label = args.query || "search";
      } else if (args.command) {
        label = args.command;
      }
      if (label.length > 50) label = label.slice(0, 50) + "...";
      toolHeader.innerHTML = iconSvg(iconName, 14) + " " + label;
      toolHeader.addEventListener("click", function () {
        toolBlock.classList.toggle("collapsed");
      });
      var toolContent = document.createElement("div");
      toolContent.className = "tool-content";
      var pre = document.createElement("pre");
      pre.className = "tool-text";
      pre.textContent = cmd;
      toolContent.appendChild(pre);
      toolBlock.appendChild(toolHeader);
      toolBlock.appendChild(toolContent);
      bubble.insertBefore(toolBlock, responseContent);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return;
    }

    if (chunk.tool_end) {
      var out = document.createElement("div");
      out.className = "tool-output";
      out.textContent = chunk.tool_end.output;
      var tc = bubble.querySelector(".tool-content");
      if (tc) {
        tc.appendChild(out);
        setTimeout(function () {
          var tb = bubble.querySelector(".tool-block");
          if (tb) tb.classList.add("collapsed");
        }, 800);
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return;
    }

    if (chunk.thinking) {
      setAvatarState("thinking");
      thinkingBuf += chunk.thinking;
      thinkingBlock.classList.remove("hidden");
      thinkingBlock.classList.add("has-thinking");
      thinkingContent.textContent = thinkingBuf;
      thinkingBlock.classList.remove("collapsed");
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chunk.text) {
      setAvatarState("talking");
      buffer += chunk.text;
      renderStreamedContent(
        bubble,
        buffer,
        thinkingBlock,
        thinkingContent,
        responseContent,
      ).then(function () {});
    }
  });

  window.electronAPI.startLLMStream(
    conversation,
    chatEffort.value || undefined,
  );
}

function createAssistantMessage() {
  const div = document.createElement("div");
  div.className = "message assistant streaming";
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

  bubble.appendChild(tb);
  bubble.appendChild(rc);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return div;
}

function parseBuffer(buffer) {
  var t = "think";
  var openTag = "<" + t + ">";
  var closeTag = "</" + t + ">";
  var openIdx = buffer.indexOf(openTag);

  if (openIdx === -1) {
    return {
      thinking: "",
      response: buffer,
      inThinking: false,
      hasThinking: false,
    };
  }

  var closeIdx = buffer.indexOf(closeTag, openIdx + openTag.length);

  if (closeIdx === -1) {
    return {
      thinking: buffer.slice(openIdx + openTag.length),
      response: buffer.slice(0, openIdx),
      inThinking: true,
      hasThinking: true,
    };
  }

  return {
    thinking: buffer.slice(openIdx + openTag.length, closeIdx),
    response:
      buffer.slice(0, openIdx) + buffer.slice(closeIdx + closeTag.length),
    inThinking: false,
    hasThinking: true,
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

  if (parsed.response) {
    responseContent.innerHTML = "";
    await renderContent(responseContent, parsed.response);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  typingIndicator.classList.remove("hidden");
  chatMessages.scrollTop = chatMessages.scrollHeight;
  setAvatarState("thinking");
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
  setAvatarState("idle");
}

async function addMessage(text, role, attachment) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

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
  await renderContent(bubble, text);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

async function renderContent(el, text) {
  try {
    el.innerHTML = await window.electronAPI.parseMarkdown(text);
  } catch (e) {
    el.textContent = text;
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
  if (status === "error") {
    visionProgressLabel.textContent = "Vision model failed to load";
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

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
