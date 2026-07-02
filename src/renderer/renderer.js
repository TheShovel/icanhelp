const avatar = document.getElementById("avatar");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const closeChatBtn = document.getElementById("close-chat");

let chatOpen = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

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

  setTimeout(() => {
    addMessage(
      "Thanks for your message! Real AI responses coming in Phase 3.",
      "assistant",
    );
  }, 400);
}

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
