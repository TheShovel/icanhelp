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

function enableClickThrough() {
  if (!chatOpen && !isDragging) {
    window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
  }
}

function disableClickThrough() {
  window.electronAPI.setIgnoreMouseEvents(false);
}

enableClickThrough();

avatar.addEventListener("mouseenter", () => {
  disableClickThrough();
});

avatar.addEventListener("mouseleave", () => {
  if (!isDragging) {
    enableClickThrough();
  }
});

avatar.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  avatar.style.cursor = "grabbing";
  disableClickThrough();
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const deltaX = e.screenX - dragStartX;
  const deltaY = e.screenY - dragStartY;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  window.electronAPI.dragWindow(deltaX, deltaY);
});

document.addEventListener("mouseup", (e) => {
  if (isDragging) {
    isDragging = false;
    avatar.style.cursor = "pointer";

    if (!chatOpen) {
      const rect = avatar.getBoundingClientRect();
      const isOverAvatar =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!isOverAvatar) {
        enableClickThrough();
      }
    }
  }
});

function toggleChat() {
  chatOpen = !chatOpen;
  if (chatOpen) {
    chatPanel.classList.remove("hidden");
    disableClickThrough();
    setTimeout(() => chatInput.focus(), 150);
  } else {
    chatPanel.classList.add("hidden");
    enableClickThrough();
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
