const avatar = document.getElementById("avatar");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const closeChatBtn = document.getElementById("close-chat");
const typingIndicator = document.getElementById("typing-indicator");

let chatOpen = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let conversation = [];

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

function toggleChat() {
  chatOpen = !chatOpen;
  if (chatOpen) {
    chatPanel.classList.remove("hidden");
    window.electronAPI.resizeWindow(400, 550);
    setTimeout(() => chatInput.focus(), 150);
  } else {
    chatPanel.classList.add("hidden");
    window.electronAPI.resizeWindow(88, 88);
  }
}

avatar.addEventListener("click", (e) => {
  if (isDragging) return;
  toggleChat();
});

closeChatBtn.addEventListener("click", () => {
  toggleChat();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && chatOpen) {
    toggleChat();
  }
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    chatInput.blur();
    toggleChat();
  }
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";

  conversation.push({ role: "user", content: text });
  showTyping();

  window.electronAPI
    .askLLM(conversation)
    .then((response) => {
      hideTyping();
      conversation.push({ role: "assistant", content: response });
      addMessage(response, "assistant");
    })
    .catch((err) => {
      hideTyping();
      addMessage("Error: " + err.message, "assistant");
    });
}

function showTyping() {
  typingIndicator.classList.remove("hidden");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
}

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  renderContent(bubble, text);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function renderContent(el, text) {
  const parts = text.split(/(```[\s\S]*?```)/);
  for (const part of parts) {
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3);
      const langMatch = code.match(/^(\w+)\n/);
      const lang = langMatch ? langMatch[1] : "";
      const codeText = langMatch ? code.slice(lang.length + 1) : code;
      const pre = document.createElement("pre");
      const codeEl = document.createElement("code");
      codeEl.textContent = codeText;
      if (lang) codeEl.className = `lang-${lang}`;
      pre.appendChild(codeEl);
      el.appendChild(pre);
    } else if (part) {
      const lines = part.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) el.appendChild(document.createElement("br"));
        const textNode = document.createTextNode(lines[i]);
        el.appendChild(textNode);
      }
    }
  }
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
