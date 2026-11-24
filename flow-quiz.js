const flowPuzzles = {
  local: {
    tag: "LOCAL · 同網段",
    title: "小安要傳資料給同一個區網裡的小晴。",
    copy: "請排出從查詢門牌到送出資料的順序。",
    intro: "ARP 只在小安所在的區域網路詢問。小晴找到自己的 IP 後，會把 MAC 門牌回覆給小安。",
    hints: [
      "先查 ARP 快取；有現成門牌就不用再問。",
      "快取沒有小晴的門牌時，小安才在本地網路廣播詢問。",
      "收到對方回覆後，小安會記住 IP 和 MAC 的對照。",
      "最後一格應該是 IPv4 資料出發，而且目的 MAC 用小晴的 BB:25。"
    ],
    blocks: [
      { id: "local-cache", text: "小安先查 ARP 快取：有沒有 192.168.1.25 的 MAC？" },
      { id: "local-request", text: "沒找到，小安廣播 ARP Request：「誰有 192.168.1.25？」" },
      { id: "local-reply", text: "小晴回答 ARP Reply：「192.168.1.25 是 BB:25。」" },
      { id: "local-send", text: "小安記住對照，再送資料：IP 目的地 192.168.1.25、乙太網路目的 MAC BB:25。" }
    ],
    order: ["local-cache", "local-request", "local-reply", "local-send"],
    success: "完全正確！小晴在同一個區網，所以小安直接找小晴的 MAC。若 ARP 快取原本就有 BB:25，就可以省略廣播與回覆。"
  },
  remote: {
    tag: "REMOTE · 不同網段",
    title: "小安要連到另一個網段的網站 203.0.113.8。",
    copy: "排出小安如何交給預設閘道，再由路由器往遠方轉送。",
    intro: "遠方網站不在小安的本地網段。小安先把資料交給預設閘道；ARP 詢問的是閘道 IP，不是網站 IP。",
    hints: [
      "先比對目的 IP 和自己的網段，判斷它是不是本地鄰居。",
      "遠方目的地要交給哪一站？看預設閘道。",
      "要用 ARP 找門牌前，先查一查閘道 MAC 是否已在快取。",
      "ARP Request 問的是閘道的 IP 192.168.1.1。",
      "小安拿到閘道 MAC 後，IP 目的地仍是 203.0.113.8。",
      "路由器收到後依路由表轉送；每一段鏈路都會使用該段的 MAC 門牌。"
    ],
    blocks: [
      { id: "remote-subnet", text: "小安比對 IP 與網段：203.0.113.8 不在自己的本地網段。" },
      { id: "remote-gateway", text: "選擇預設閘道 192.168.1.1 當下一站，而不是直接找網站的 MAC。" },
      { id: "remote-cache", text: "小安先查 ARP 快取，看是否已記住閘道的 MAC。" },
      { id: "remote-request", text: "快取沒有紀錄，小安廣播 ARP Request：「誰有 192.168.1.1？」" },
      { id: "remote-reply", text: "路由器回覆自己的本地 MAC：02:00:00:00:00:01；小安記住這筆對照。" },
      { id: "remote-send", text: "小安送出資料：IP 目的地仍是 203.0.113.8，乙太網路目的 MAC 是 02:00:00:00:00:01。" },
      { id: "remote-forward", text: "閘道依路由表轉送；每經過一段網路，乙太網路 MAC 會換成該段的下一站。" }
    ],
    order: ["remote-subnet", "remote-gateway", "remote-cache", "remote-request", "remote-reply", "remote-send", "remote-forward"],
    success: "排對了！跨網段時，ARP 只幫小安找到本地閘道的 MAC。IP 封包仍以網站 203.0.113.8 為目的地；路由器逐段轉送時，外層 MAC 會跟著每一段的下一站改變。"
  }
};

const flowSlots = document.querySelector("#flow-slots");
const flowBank = document.querySelector("#flow-bank");
const flowTitle = document.querySelector("#flow-question-title");
const flowCopy = document.querySelector("#flow-question-copy");
const flowTag = document.querySelector("#flow-tag");
const flowFeedback = document.querySelector("#flow-feedback");
const flowInsight = document.querySelector("#flow-insight");
const flowProgress = document.querySelector("#flow-progress");
const flowBankCount = document.querySelector("#flow-bank-count");

let activeRoute = "local";
let selectedBlock = null;
let solvedRoutes = new Set();
let slotsByRoute = { local: [], remote: [] };
let trayOrderByRoute = { local: [], remote: [] };

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffledBlocks(route) {
  const puzzle = flowPuzzles[route];
  let result = shuffle(puzzle.blocks.map((block) => block.id));
  while (result.every((id, index) => id === puzzle.order[index])) result = shuffle(result);
  return result;
}

function getPuzzle() {
  return flowPuzzles[activeRoute];
}

function createBlock(block, isSelected = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `flow-block${isSelected ? " is-selected" : ""}`;
  button.dataset.block = block.id;
  button.draggable = true;
  button.setAttribute("aria-pressed", String(isSelected));
  button.setAttribute("aria-label", `流程積木：${block.text}。按 Enter 選取，再按 Tab 移到空格並按 Enter 放置。`);
  button.innerHTML = `<span class="flow-block-grip" aria-hidden="true">⠿</span><span>${block.text}</span>`;
  button.addEventListener("click", () => selectBlock(block.id));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectBlock(block.id);
      flowSlots.querySelector(".flow-slot:not(.has-block)")?.focus();
    }
  });
  button.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", block.id);
    event.dataTransfer.effectAllowed = "move";
    selectedBlock = block.id;
    button.classList.add("is-dragging");
  });
  button.addEventListener("dragend", () => button.classList.remove("is-dragging"));
  return button;
}

function renderFlow() {
  const puzzle = getPuzzle();
  const slots = slotsByRoute[activeRoute];
  flowSlots.dataset.route = activeRoute;
  flowTag.textContent = puzzle.tag;
  flowTitle.textContent = puzzle.title;
  flowCopy.textContent = puzzle.copy;
  flowProgress.textContent = `情境 ${activeRoute === "local" ? 1 : 2} / 2 · ${solvedRoutes.has(activeRoute) ? "已完成" : "尚未完成"}`;
  flowProgress.dataset.done = String(solvedRoutes.has(activeRoute));
  flowSlots.replaceChildren();
  flowBank.replaceChildren();

  puzzle.order.forEach((_, index) => {
    const slot = document.createElement("div");
    slot.className = `flow-slot${slots[index] ? " has-block" : ""}`;
    slot.dataset.slot = String(index);
    slot.tabIndex = 0;
    slot.setAttribute("role", "group");
    slot.setAttribute("aria-label", `第 ${index + 1} 步${slots[index] ? "，已放入積木" : "，空格"}。選取積木後按 Enter 放置。`);
    const number = document.createElement("span");
    number.className = "flow-slot-number";
    number.textContent = String(index + 1).padStart(2, "0");
    slot.append(number);
    const block = puzzle.blocks.find((item) => item.id === slots[index]);
    if (block) slot.append(createBlock(block, selectedBlock === block.id));
    else {
      const placeholder = document.createElement("span");
      placeholder.className = "flow-slot-placeholder";
      placeholder.textContent = "拖一塊積木到這裡";
      slot.append(placeholder);
    }
    slot.addEventListener("click", (event) => {
      if (event.target.closest(".flow-block")) return;
      if (selectedBlock) placeBlock(selectedBlock, index);
    });
    slot.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && selectedBlock) {
        event.preventDefault();
        placeBlock(selectedBlock, index);
      }
    });
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drop-target");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drop-target"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("is-drop-target");
      const blockId = event.dataTransfer.getData("text/plain");
      if (blockId) placeBlock(blockId, index);
    });
    flowSlots.append(slot);
  });

  const placed = new Set(slots.filter(Boolean));
  const remainingIds = trayOrderByRoute[activeRoute].filter((id) => !placed.has(id));
  const remaining = remainingIds.map((id) => puzzle.blocks.find((block) => block.id === id)).filter(Boolean);
  remaining.forEach((block) => flowBank.append(createBlock(block, selectedBlock === block.id)));
  flowBankCount.textContent = `還有 ${remaining.length} 塊`;
}

function selectBlock(blockId) {
  selectedBlock = selectedBlock === blockId ? null : blockId;
  renderFlow();
  flowFeedback.textContent = selectedBlock
    ? "已選取積木；點選一個空格放置，或直接拖曳。"
    : "已取消選取。";
}

function placeBlock(blockId, targetIndex) {
  const puzzle = getPuzzle();
  const slots = slotsByRoute[activeRoute];
  const sourceIndex = slots.indexOf(blockId);
  const targetBlock = slots[targetIndex];
  if (sourceIndex === targetIndex) return;
  if (sourceIndex !== -1) slots[sourceIndex] = targetBlock || null;
  slots[targetIndex] = blockId;
  if (sourceIndex === -1) trayOrderByRoute[activeRoute] = trayOrderByRoute[activeRoute].filter((id) => id !== blockId);
  if (sourceIndex === -1 && targetBlock) trayOrderByRoute[activeRoute].push(targetBlock);
  selectedBlock = null;
  flowFeedback.textContent = "積木放好了！接著排剩下的步驟，或檢查答案。";
  flowFeedback.dataset.state = "neutral";
  flowInsight.innerHTML = `<b>小提醒：</b> ${puzzle.intro}`;
  renderFlow();
  flowSlots.querySelector(`[data-slot="${targetIndex}"]`)?.focus();
}

function resetRoute() {
  slotsByRoute[activeRoute] = Array(getPuzzle().order.length).fill(null);
  trayOrderByRoute[activeRoute] = shuffledBlocks(activeRoute);
  selectedBlock = null;
  flowFeedback.textContent = "積木已重新打亂。再挑戰一次吧！";
  flowFeedback.dataset.state = "neutral";
  flowInsight.innerHTML = `<b>先想想：</b> ${getPuzzle().intro}`;
  renderFlow();
}

function checkRoute() {
  const puzzle = getPuzzle();
  const slots = slotsByRoute[activeRoute];
  const emptyIndex = slots.indexOf(null);
  if (emptyIndex !== -1) {
    flowFeedback.textContent = `還有第 ${emptyIndex + 1} 格沒放積木，先把所有步驟排進去。`;
    flowFeedback.dataset.state = "hint";
    flowSlots.querySelector(`[data-slot="${emptyIndex}"]`)?.focus();
    return;
  }
  const wrongIndex = slots.findIndex((blockId, index) => blockId !== puzzle.order[index]);
  if (wrongIndex !== -1) {
    flowFeedback.textContent = `第 ${wrongIndex + 1} 格順序不太對。想想看：${puzzle.hints[wrongIndex]}`;
    flowFeedback.dataset.state = "wrong";
    return;
  }
  solvedRoutes.add(activeRoute);
  flowFeedback.textContent = "太好了，順序完全正確！";
  flowFeedback.dataset.state = "correct";
  flowInsight.innerHTML = `<b>答對了：</b> ${puzzle.success}`;
  renderFlow();
}

document.querySelectorAll(".flow-scenario").forEach((button) => {
  button.addEventListener("click", () => {
    activeRoute = button.dataset.route;
    selectedBlock = null;
    document.querySelectorAll(".flow-scenario").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    flowFeedback.textContent = "準備好了就開始排！";
    flowFeedback.dataset.state = "neutral";
    flowInsight.innerHTML = `<b>先想想：</b> ${getPuzzle().intro}`;
    renderFlow();
  });
});

document.querySelector("#flow-check").addEventListener("click", checkRoute);
document.querySelector("#flow-reset").addEventListener("click", resetRoute);
document.querySelector("#flow-hint").addEventListener("click", () => {
  const puzzle = getPuzzle();
  const slots = slotsByRoute[activeRoute];
  const firstGap = slots.indexOf(null);
  const firstWrong = firstGap !== -1 ? firstGap : slots.findIndex((id, index) => id !== puzzle.order[index]);
  const index = firstWrong === -1 ? 0 : firstWrong;
  flowFeedback.textContent = `第 ${index + 1} 格提示：${puzzle.hints[index]}`;
  flowFeedback.dataset.state = "hint";
});

for (const route of Object.keys(flowPuzzles)) {
  slotsByRoute[route] = Array(flowPuzzles[route].order.length).fill(null);
  trayOrderByRoute[route] = shuffledBlocks(route);
}
renderFlow();
