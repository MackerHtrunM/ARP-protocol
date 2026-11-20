if (document.querySelector("#topology")) {
const scenarios = {
  normal: [
    { title: "小安先找找看", description: "小安想傳訊息給小晴。自己的 ARP 對照表還沒有小晴的 MAC，所以要先問問。", kind: "ARP Request · 詢問", sender: "小安 → 大家", target: "192.168.1.25", aside: "「誰有 192.168.1.25？請告訴我你的 MAC！」這個問題會廣播給本地網路。", from: "you", to: "switch", icon: "?", fake: false },
    { title: "交換器轉告大家", description: "交換器把廣播訊息送給本地網路裡的裝置。只有目標 IP 是 192.168.1.25 的小晴會認出來。", kind: "廣播 · Broadcast", sender: "交換器 → 本地網路", target: "192.168.1.25", aside: "廣播就像在教室裡大聲問問題，同一個網段的裝置都會收到。", from: "switch", to: "target", icon: "✉", fake: false },
    { title: "小晴回覆門牌", description: "小晴確認目標 IP 是自己，回覆小安：「我的 MAC 是 BB:25。」", kind: "ARP Reply · 回覆", sender: "小晴 → 小安", target: "192.168.1.12", aside: "回覆通常直接傳給詢問者。小安可以把這筆 IP/MAC 對照暫存在 ARP 快取。", from: "target", to: "you", icon: "✓", fake: false },
    { title: "資料找到正確方向", description: "小安記住小晴的 MAC，現在可以把訊息交給正確的網路卡。任務完成！", kind: "資料封包 · Data", sender: "小安 → 小晴", target: "192.168.1.25", aside: "這次 IP 找對了 MAC，封包就能在本地網路找到小晴。", from: "you", to: "target", icon: "✦", fake: false }
  ],
  spoof: [
    { title: "小安開始詢問", description: "小安廣播詢問：「誰有 192.168.1.25？」本地網路上的裝置都可能聽見。", kind: "ARP Request · 詢問", sender: "小安 → 大家", target: "192.168.1.25", aside: "正常流程從這裡開始，等著小晴用自己的 MAC 回覆。", from: "you", to: "switch", icon: "?", fake: false },
    { title: "小晴給出正確答案", description: "小晴回覆：「192.168.1.25 是我，MAC 是 BB:25。」這是正確的對照。", kind: "ARP Reply · 回覆", sender: "小晴 → 小安", target: "192.168.1.12", aside: "ARP 的回覆沒有內建身分驗證，裝置可能接受收到的對照資料。", from: "target", to: "you", icon: "✓", fake: false },
    { title: "陌生裝置也來搶答", description: "陌生裝置假裝自己是 192.168.1.25，謊稱 MAC 是 CC:99。小安可能把錯的答案記進 ARP 快取。", kind: "假的 ARP Reply · 冒充", sender: "陌生裝置 → 小安", target: "192.168.1.12", aside: "這種欺騙式的 IP/MAC 配對會污染 ARP 快取，也就是 ARP spoofing。", from: "rogue", to: "you", icon: "!", fake: true },
    { title: "資料被帶錯路", description: "小安依照被騙到的紀錄，把原本要給小晴的資料送到陌生裝置。", kind: "資料封包 · 被誤導", sender: "小安 → 陌生裝置", target: "192.168.1.25", aside: "冒充者可能攔下資料或讓連線中斷。加密連線、網路設備檢查等措施能降低風險。", from: "you", to: "rogue", icon: "!", fake: true }
  ]
};

const topology = document.querySelector("#topology");
const packet = document.querySelector("#packet-bubble");
const stepTitle = document.querySelector("#step-title");
const stepDescription = document.querySelector("#step-description");
const stepCounter = document.querySelector("#step-counter");
const packetKind = document.querySelector("#packet-kind");
const packetSender = document.querySelector("#packet-sender");
const packetTarget = document.querySelector("#packet-target");
const packetAside = document.querySelector("#packet-aside");
const progressFill = document.querySelector("#progress-fill");
const statusText = document.querySelector("#lab-status-text");
const nextButton = document.querySelector("#next-button");
const playButton = document.querySelector("#play-button");
let scenario = "normal";
let step = 0;
let playback = null;

function deviceCenter(name) {
  const device = document.querySelector(`.device-${name}`);
  const parent = topology.getBoundingClientRect();
  const rect = device.getBoundingClientRect();
  return { x: rect.left - parent.left + rect.width / 2, y: rect.top - parent.top + rect.height / 2 };
}

function resetLab() {
  if (playback) clearInterval(playback);
  playback = null;
  step = 0;
  topology.classList.remove("has-packet");
  document.querySelectorAll(".device").forEach((item) => item.classList.remove("is-active"));
  packet.classList.remove("visible", "fake");
  stepCounter.textContent = `STEP 0 / ${scenarios[scenario].length}`;
  stepTitle.textContent = "準備出發了嗎？";
  stepDescription.textContent = scenario === "normal"
    ? "小安要傳訊息給小晴，先看看自己的 ARP 對照表有沒有小晴的 MAC。"
    : "切換到假冒情境，觀察錯誤的 ARP 回覆如何把資料帶錯路。";
  packetKind.textContent = "尚未送出";
  packetSender.textContent = "—";
  packetTarget.textContent = "192.168.1.25";
  packetAside.textContent = "等等看看封包裡有哪些資訊。";
  progressFill.style.width = "0%";
  nextButton.innerHTML = "送出下一個封包 <span aria-hidden=\"true\">↗</span>";
  playButton.textContent = "▶ 自動播放";
  statusText.textContent = "模擬準備就緒";
}

function showStep() {
  const events = scenarios[scenario];
  if (step >= events.length) {
    statusText.textContent = "模擬完成，可以重來";
    nextButton.textContent = "再看一次";
    if (playback) clearInterval(playback);
    playback = null;
    playButton.textContent = "▶ 自動播放";
    return;
  }
  const event = events[step];
  step += 1;
  const from = deviceCenter(event.from);
  const to = deviceCenter(event.to);
  packet.style.left = `${from.x}px`;
  packet.style.top = `${from.y}px`;
  packet.textContent = event.icon;
  packet.classList.toggle("fake", event.fake);
  packet.classList.add("visible");
  topology.classList.add("has-packet");
  document.querySelectorAll(".device").forEach((item) => item.classList.remove("is-active"));
  document.querySelector(`.device-${event.from}`).classList.add("is-active");
  requestAnimationFrame(() => {
    packet.style.left = `${to.x}px`;
    packet.style.top = `${to.y}px`;
  });
  setTimeout(() => document.querySelector(`.device-${event.to}`)?.classList.add("is-active"), 430);
  stepCounter.textContent = `STEP ${step} / ${events.length}`;
  stepTitle.textContent = event.title;
  stepDescription.textContent = event.description;
  packetKind.textContent = event.kind;
  packetSender.textContent = event.sender;
  packetTarget.textContent = event.target;
  packetAside.textContent = event.aside;
  progressFill.style.width = `${(step / events.length) * 100}%`;
  statusText.textContent = scenario === "spoof" && event.fake ? "發現可疑封包" : "正在傳遞封包";
  if (step === events.length) nextButton.textContent = "完成，從頭再看 ⟲";
}

nextButton.addEventListener("click", () => {
  if (step >= scenarios[scenario].length) resetLab();
  showStep();
});
document.querySelector("#reset-button").addEventListener("click", resetLab);
playButton.addEventListener("click", () => {
  if (playback) {
    clearInterval(playback);
    playback = null;
    playButton.textContent = "▶ 繼續播放";
    statusText.textContent = "已暫停";
    return;
  }
  if (step >= scenarios[scenario].length) resetLab();
  showStep();
  playback = setInterval(() => {
    if (step >= scenarios[scenario].length) {
      showStep();
      return;
    }
    showStep();
  }, 1750);
  playButton.textContent = "Ⅱ 暫停播放";
});
document.querySelectorAll(".scenario-button").forEach((button) => {
  button.addEventListener("click", () => {
    scenario = button.dataset.scenario;
    document.querySelectorAll(".scenario-button").forEach((other) => {
      const active = other === button;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    topology.classList.toggle("scenario-spoof", scenario === "spoof");
    resetLab();
  });
});

resetLab();
}

if (document.querySelector("#quiz-card")) {
const quiz = [
  { question: "ARP 主要幫忙查出哪兩種地址的對照？", choices: ["網址和密碼", "IPv4 位址和 MAC 位址", "姓名和電話"], answer: 1, explanation: "答對！ARP 幫忙找到 IPv4 位址在本地網路中對應的 MAC 位址。" },
  { question: "ARP Request 通常怎麼問同一個本地網路？", choices: ["只傳給全世界一台電腦", "廣播詢問大家", "寄到搜尋引擎"], answer: 1, explanation: "沒錯！ARP Request 會在本地網路廣播，目標裝置再回覆。" },
  { question: "ARP spoofing 可能讓電腦記住什麼錯誤資料？", choices: ["IP 對 MAC 的錯誤配對", "錯誤的螢幕亮度", "錯誤的 Wi-Fi 密碼"], answer: 0, explanation: "答對！冒充者謊報 IP/MAC 配對，可能造成快取污染和流量被誤導。" }
];
let quizIndex = 0;
let quizScore = 0;
let answered = false;
const quizCount = document.querySelector("#quiz-count");
const quizQuestion = document.querySelector("#quiz-question");
const quizOptions = document.querySelector("#quiz-options");
const quizFeedback = document.querySelector("#quiz-feedback");
const quizNext = document.querySelector("#quiz-next");

function renderQuiz() {
  const item = quiz[quizIndex];
  quizCount.textContent = `問題 ${quizIndex + 1} / ${quiz.length}`;
  document.querySelectorAll(".quiz-dots i").forEach((dot, i) => dot.classList.toggle("current", i === quizIndex));
  quizQuestion.textContent = item.question;
  quizOptions.replaceChildren();
  quizFeedback.hidden = true;
  quizNext.hidden = true;
  answered = false;
  item.choices.forEach((choice, i) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + i)}　${choice}`;
    button.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const correct = i === item.answer;
      if (correct) quizScore += 1;
      quizOptions.querySelectorAll("button").forEach((option, optionIndex) => {
        option.disabled = true;
        if (optionIndex === item.answer) option.classList.add("correct");
        else if (optionIndex === i) option.classList.add("incorrect");
      });
      quizFeedback.textContent = `${correct ? "答對了！" : "再記一下～"} ${item.explanation}`;
      quizFeedback.hidden = false;
      quizNext.hidden = false;
      quizNext.innerHTML = quizIndex === quiz.length - 1 ? "看結果 <span aria-hidden=\"true\">↗</span>" : "下一題 <span aria-hidden=\"true\">↗</span>";
    });
    quizOptions.append(button);
  });
}

quizNext.addEventListener("click", () => {
  quizIndex += 1;
  if (quizIndex >= quiz.length) {
    quizQuestion.textContent = quizScore === quiz.length ? "太棒了！你已經是封包小高手！" : `探險完成！你答對了 ${quizScore} / ${quiz.length} 題。`;
    quizOptions.replaceChildren();
    quizFeedback.textContent = "想再挑戰一次？把 ARP 查詢和假冒情境重新播放，觀察封包差在哪裡。";
    quizFeedback.hidden = false;
    quizNext.textContent = "再玩一次";
    quizNext.hidden = false;
    quizNext.onclick = () => { quizIndex = 0; quizScore = 0; quizNext.onclick = null; renderQuiz(); };
    return;
  }
  renderQuiz();
});

renderQuiz();
}
