const spoofTabs = [...document.querySelectorAll(".spoof-tab")];
const spoofPanels = [...document.querySelectorAll(".spoof-tab-panel")];

function activateTab(tab, moveFocus = false) {
  spoofTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  spoofPanels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  });
  if (moveFocus) tab.focus();
}

spoofTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? spoofTabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + spoofTabs.length) % spoofTabs.length;
    activateTab(spoofTabs[nextIndex], true);
  });
});

if (window.location.hash === "#panel-defense") activateTab(document.querySelector("#tab-defense"));

const modeButtons = [...document.querySelectorAll(".spoof-mode-button")];
const network = document.querySelector("#spoof-network");
const cacheState = document.querySelector("#spoof-cache-state");
const cacheMac = document.querySelector("#spoof-cache-mac");
const outcomeIcon = document.querySelector("#spoof-outcome-icon");
const outcomeText = document.querySelector("#spoof-outcome-text");
const spoofMessage = document.querySelector("#spoof-message");

function setMode(mode) {
  const isSpoofed = mode === "spoofed";
  network.dataset.mode = mode;
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  cacheState.textContent = isSpoofed ? "對照可能錯誤" : "正常紀錄";
  cacheMac.textContent = isSpoofed ? "CC:99 · 陌生裝置" : "BB:25 · 小晴";
  outcomeIcon.textContent = isSpoofed ? "⚠" : "✓";
  outcomeText.innerHTML = isSpoofed
    ? "<b>封包可能先到陌生裝置</b>IP 目的地仍是小晴，但這一段的目的 MAC 變成 CC:99。"
    : "<b>封包找到小晴</b>小安把資料交給 BB:25，小晴收到訊息。";
  spoofMessage.textContent = isSpoofed ? "冒名 ARP" : "ARP 回覆";
  network.classList.remove("spoof-animate");
  requestAnimationFrame(() => network.classList.add("spoof-animate"));
}

modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

const answerFeedback = document.querySelector("#spoof-answer-feedback");
document.querySelectorAll(".spoof-answers button").forEach((button) => {
  button.addEventListener("click", () => {
    const correct = button.dataset.answer === "suspicious";
    document.querySelectorAll(".spoof-answers button").forEach((option) => {
      option.setAttribute("aria-pressed", String(option === button));
      option.classList.toggle("is-correct", option === button && correct);
      option.classList.toggle("is-incorrect", option === button && !correct);
    });
    answerFeedback.textContent = correct
      ? "答對了！同一個 IP 突然對應另一個 MAC 是值得查證的線索；也要排除網卡更換等正常原因。"
      : "這是題目中的原本紀錄。請找出突然換成陌生 MAC 的那一筆。";
  });
});
