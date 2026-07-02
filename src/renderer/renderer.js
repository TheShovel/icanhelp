const avatar = document.getElementById("avatar");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const closeChatBtn = document.getElementById("close-chat");
const chatSettingsBtn = document.getElementById("chat-settings");
const chatEffort = document.getElementById("chat-effort");
const typingIndicator = document.getElementById("typing-indicator");
const setupPanel = document.getElementById("setup-panel");
const setupProvider = document.getElementById("setup-provider");
const setupKey = document.getElementById("setup-key");
const setupEndpoint = document.getElementById("setup-endpoint");
const setupModel = document.getElementById("setup-model");
const setupSave = document.getElementById("setup-save");
const setupStatus = document.getElementById("setup-status");
const closeSetupBtn = document.getElementById("close-setup");

let chatOpen = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let conversation = [];
let needsSetup = true;

avatar.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  avatar.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
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
  setupModel.innerHTML = '<option value="">— enter API key to load models —</option>';
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
      setTimeout(() => chatInput.focus(), 150);
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
      setupStatus.textContent = "No models returned. Check the endpoint and key.";
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

avatar.addEventListener("click", (e) => {
  if (isDragging) return;
  togglePanel();
});

closeChatBtn.addEventListener("click", () => {
  togglePanel();
});

chatSettingsBtn.addEventListener("click", () => {
  if (!chatOpen) return;
  chatPanel.classList.add("hidden");
  setupPanel.classList.remove("hidden");
  window.electronAPI.getConfig().then(function (cfg) {
    if (cfg) {
      setupProvider.value = cfg.provider || "openrouter";
      setupEndpoint.value = cfg.endpoint || "";
      setupModel.value = cfg.model || "";
    }
  });
  setupStatus.textContent = "Update your settings below.";
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
  if (e.key === "Escape" && chatOpen) {
    togglePanel();
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
    if (cfg && cfg.reasoningEffort) {
      chatEffort.value = cfg.reasoningEffort;
    }
  });
  chatEffort.addEventListener("change", function () {
    window.electronAPI.saveEffort(chatEffort.value || undefined);
  });
  window.electronAPI.validateStoredConfig().then((result) => {
    if (!result.valid) {
      needsSetup = true;
      setupStatus.textContent = "Stored config is invalid: " + result.error + " — update it below.";
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
  var text = chatInput.value.trim();
  if (!text) return;

  await addMessage(text, "user");
  chatInput.value = "";

  conversation.push({ role: "user", content: text });
  showTyping();

  var msgEl = null;
  var bubble = null;
  var thinkingContent = null;
  var thinkingBlock = null;
  var responseContent = null;
  var buffer = "";
  var thinkingBuf = "";

  const cleanup = window.electronAPI.onLLMChunk(function (chunk) {
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
      responseContent.textContent = "Error: " + chunk.error;
      msgEl.classList.remove("streaming");
      return;
    }

    if (chunk.done) {
      cleanup();
      msgEl.classList.remove("streaming");
      if (!thinkingBlock.classList.contains("has-thinking")) {
        thinkingBlock.classList.add("hidden");
      } else {
        setTimeout(function () {
          thinkingBlock.classList.add("collapsed");
        }, 600);
      }
      conversation.push({ role: "assistant", content: buffer });
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
      var cmd = chunk.tool_start.args.command || JSON.stringify(chunk.tool_start.args);
      var toolBlock = document.createElement("div");
      toolBlock.className = "tool-block";
      var toolHeader = document.createElement("div");
      toolHeader.className = "tool-header";
      var icon = "⚡";
      var label = chunk.tool_start.name;
      var args = chunk.tool_start.args || {};
      if (chunk.tool_start.name === "search_web") {
        icon = "🔍";
        label = args.query || "search";
      } else if (args.command) {
        label = args.command;
      }
      if (label.length > 50) label = label.slice(0, 50) + "...";
      toolHeader.textContent = icon + " " + label;
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
      thinkingBuf += chunk.thinking;
      thinkingBlock.classList.remove("hidden");
      thinkingBlock.classList.add("has-thinking");
      thinkingContent.textContent = thinkingBuf;
      thinkingBlock.classList.remove("collapsed");
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chunk.text) {
      buffer += chunk.text;
      renderStreamedContent(bubble, buffer, thinkingBlock, thinkingContent, responseContent).then(function () {});
    }
  });

  window.electronAPI.startLLMStream(conversation, chatEffort.value || undefined);
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
  th.textContent = "🧠 Thinking";
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
    return { thinking: "", response: buffer, inThinking: false, hasThinking: false };
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
    response: buffer.slice(0, openIdx) + buffer.slice(closeIdx + closeTag.length),
    inThinking: false,
    hasThinking: true,
  };
}

async function renderStreamedContent(bubble, buffer, thinkingBlock, thinkingContent, responseContent) {
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
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
}

async function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
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

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
