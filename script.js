if (document.querySelector("#topology")) {
const frames = {
  request: { kind: "Request · opcode 1", destination: "FF:FF:FF:FF:FF:FF · 廣播", sender: "192.168.1.12", senderMac: "AA:12", target: "192.168.1.25", targetMac: "未知 · 00:00…" },
  reply: { kind: "Reply · opcode 2", destination: "AA:12 · 單點傳送", sender: "192.168.1.25", senderMac: "BB:25", target: "192.168.1.12", targetMac: "AA:12" },
  fakeReply: { kind: "假 Reply · opcode 2", destination: "AA:12 · 單點傳送", sender: "192.168.1.25", senderMac: "CC:99（謊報）", target: "192.168.1.12", targetMac: "AA:12" },
  data: { kind: "不是 ARP · IPv4 資料", destination: "BB:25 · 單點傳送", sender: "192.168.1.12", senderMac: "AA:12", target: "192.168.1.25", targetMac: "BB:25" },
  misdirectedData: { kind: "不是 ARP · IPv4 資料", destination: "CC:99 · 單點傳送", sender: "192.168.1.12", senderMac: "AA:12", target: "192.168.1.25", targetMac: "CC:99（錯誤）" }
};
const scenarios = {
  normal: [
    { title: "快取沒答案，先廣播詢問", description: "小安要傳資料給小晴，但 ARP 快取查不到她的 MAC。Request 在 ARP 內容裡寫上目標 IP，目標 MAC 留空；外層乙太網路目的 MAC 則用廣播。", kind: "ARP Request · 詢問", sender: "小安 → 本地網路", target: "192.168.1.25", aside: "別混淆兩層地址：ARP 目標 MAC 尚未知，乙太網路目的 MAC 才是 FF:FF:FF:FF:FF:FF。", frame: frames.request, cache: "未知", from: "you", to: "switch", icon: "?", fake: false },
    { title: "交換器送到同一個區網", description: "交換器依照 MAC 廣播地址，將這個訊問送給同一個區域網路中的裝置。不同網段的電腦不會收到這次廣播。", kind: "ARP Request · 廣播", sender: "交換器 → 同一網段", target: "192.168.1.25", aside: "ARP 不會穿越路由器。若目標在別的網段，小安要查的是下一站路由器的 MAC。", frame: frames.request, cache: "未知", from: "switch", to: "target", icon: "✉", fake: false },
    { title: "小晴用 Reply 回答", description: "小晴認出目標 IP 是自己，回覆「我的 MAC 是 BB:25」。回覆通常只送給小安，不需要再問全班。", kind: "ARP Reply · 回覆", sender: "小晴 → 小安", target: "192.168.1.12", aside: "Reply 把小安的 IP/MAC 放在目標欄位，小安可把小晴的 IP → BB:25 暫存在快取。", frame: frames.reply, cache: "BB:25", from: "target", to: "you", icon: "✓", fake: false },
    { title: "用 MAC 送真正的資料", description: "查詢完成後，資料本身會放在 IPv4 封包裡。外層乙太網路標頭使用剛查到的 BB:25，這個資料封包不是 ARP。", kind: "IPv4 資料 · 已解析", sender: "小安 → 小晴", target: "192.168.1.25", aside: "IP 目的地仍是小晴；乙太網路目的 MAC 是 BB:25。IP 和 MAC 各自在不同層工作。", frame: frames.data, cache: "BB:25", from: "you", to: "target", icon: "✦", fake: false }
  ],
  cached: [
    { title: "快取命中，省下一輪詢問", description: "小安已暫存 192.168.1.25 → BB:25。這次不用送 ARP Request，直接把 IPv4 資料交給小晴的網卡。", kind: "IPv4 資料 · 快取命中", sender: "小安 → 小晴", target: "192.168.1.25", aside: "ARP 快取像短期對照表。動態項目會過期；新連線若查不到目標，才需要重新解析。", frame: frames.data, cache: "BB:25", from: "you", to: "target", icon: "✦", fake: false }
  ],
  spoof: [
    { title: "小安廣播詢問目標 IP", description: "小安在本地網路廣播「誰有 192.168.1.25？」同網段的裝置都可能聽見。", kind: "ARP Request · 詢問", sender: "小安 → 本地網路", target: "192.168.1.25", aside: "Request 的廣播是外層乙太網路目的 MAC；ARP 內容的目標 MAC 仍是未知。", frame: frames.request, cache: "未知", from: "you", to: "switch", icon: "?", fake: false },
    { title: "小晴先回覆正確門牌", description: "小晴回覆 192.168.1.25 對應 BB:25，小安先記住這筆正常配對。", kind: "ARP Reply · 正常", sender: "小晴 → 小安", target: "192.168.1.12", aside: "請看發送者欄位：IP 和 MAC 是同一個寄件者自己提供的聲明。ARP 沒有簽章替它驗明身分。", frame: frames.reply, cache: "BB:25", from: "target", to: "you", icon: "✓", fake: false },
    { title: "陌生裝置送來矛盾聲明", description: "陌生裝置也宣稱「192.168.1.25 是我」，但提供 MAC CC:99。某些裝置可能因此把小安的快取更新成錯誤配對。", kind: "ARP Reply · 可疑聲明", sender: "陌生裝置 → 小安", target: "192.168.1.12", aside: "ARP spoofing 的關鍵不是偷走 IP，而是讓受害裝置相信錯誤的 IP → MAC 對照。不同系統接受方式可能不同。", frame: frames.fakeReply, cache: "CC:99", from: "rogue", to: "you", icon: "!", fake: true },
    { title: "IP 沒變，乙太網路目的地被改了", description: "小安仍想把資料送到 IP 192.168.1.25，卻照著受污染的快取把乙太網路封包送往 CC:99。", kind: "IPv4 資料 · 目的 MAC 錯誤", sender: "小安 → 陌生裝置", target: "192.168.1.25", aside: "冒充者若轉送流量，可能形成中間人路徑；若直接丟棄，可能造成斷線。HTTPS 能保護內容，但不會修好 ARP 快取。", frame: frames.misdirectedData, cache: "CC:99", from: "you", to: "rogue", icon: "!", fake: true }
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
const ethernetDest = document.querySelector("#ethernet-dest");
const packetAside = document.querySelector("#packet-aside");
const cacheState = document.querySelector("#cache-state");
const cacheMapping = document.querySelector("#cache-mapping");
const cacheMappingDetail = document.querySelector("#cache-mapping-detail");
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
  const cached = scenario === "cached";
  packetSender.textContent = cached ? "192.168.1.12 → AA:12" : "—";
  packetTarget.textContent = cached ? "192.168.1.25 → BB:25" : "192.168.1.25 → 未知";
  ethernetDest.textContent = cached ? "BB:25 · 單點" : "—";
  packetAside.textContent = "注意 ARP 目標 MAC 與乙太網路目的 MAC 是不同欄位。";
  cacheState.textContent = cached ? "有效對照已存在" : "快取未命中";
  cacheMapping.textContent = cached ? "BB:25" : "未知";
  cacheMappingDetail.textContent = cached ? "192.168.1.25 → BB:25" : "尚未查詢";
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
  packetKind.textContent = event.frame.kind;
  ethernetDest.textContent = event.frame.destination;
  packetSender.textContent = `${event.frame.sender} → ${event.frame.senderMac}`;
  packetTarget.textContent = `${event.frame.target} → ${event.frame.targetMac}`;
  packetAside.textContent = event.aside;
  cacheMapping.textContent = event.cache;
  cacheMappingDetail.textContent = `192.168.1.25 → ${event.cache}`;
  cacheState.textContent = event.cache === "未知" ? "快取未命中" : event.cache === "CC:99" ? "⚠ 配對被改寫" : "已記住對照";
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
  { level: "ROUND 1 · 基礎概念", question: "小安要找同一個區網裡的 192.168.1.25。ARP Request 外層乙太網路的目的 MAC 是什麼？", choices: ["FF:FF:FF:FF:FF:FF，廣播給同一個區網", "BB:25，因為已經知道小晴的 MAC", "00:00:00:00:00:00，代表廣播"], answer: 0, explanation: "乙太網路目的 MAC 用 FF:FF:FF:FF:FF:FF 廣播；00:00… 是 ARP 內容中的目標硬體地址未知值，兩個欄位不要混在一起。" },
  { level: "ROUND 1 · 基礎概念", question: "Request 已知目標 IP 是 192.168.1.25，但還不知道對方 MAC。ARP 內容的「目標 MAC」通常會是？", choices: ["小安自己的 AA:12", "全 00，表示目前未知", "FF:FF:FF:FF:FF:FF"], answer: 1, explanation: "全 00 表示 ARP 還不知道目標網卡的 MAC。外層乙太網路目的地才是 FF:FF:FF:FF:FF:FF。" },
  { level: "ROUND 1 · 基礎概念", question: "小晴回覆 BB:25 後，小安送 IPv4 資料給她。外層乙太網路目的 MAC 應該是哪個？", choices: ["192.168.1.25", "FF:FF:FF:FF:FF:FF", "BB:25"], answer: 2, explanation: "IP 目的位址仍是 192.168.1.25；同一個區網上的乙太網路目的 MAC 是 BB:25。這就是兩層地址分工。" },
  { level: "ROUND 1 · 基礎概念", question: "小安要連到另一個網段的網站。第一個乙太網路封包通常交給誰？", choices: ["遠方網站主機的 MAC，ARP 會跨網路找它", "本地路由器（預設閘道）的 MAC", "所有網路上的裝置一起收到"], answer: 1, explanation: "路由器會一站一站轉送。小安先用 ARP 找本地預設閘道的 MAC，ARP 廣播不會穿越路由器。" },
  { level: "ROUND 2 · 拆解封包", question: "ARP 的 opcode 數字代表什麼？如果看到 opcode = 2，這是哪種訊息？", choices: ["Request 詢問", "Reply 回覆", "IPv4 資料"], answer: 1, explanation: "RFC 826 定義 1 是 Request、2 是 Reply。一般 IPv4 資料不會使用 ARP opcode。" },
  { level: "ROUND 2 · 拆解封包", question: "ARP 封包裡的 sender IP 和 sender MAC 是由誰提供的？", choices: ["寄出 ARP 封包的裝置自己宣告", "交換器查詢全球資料庫後填入", "路由器從 DNS 名稱推算"], answer: 0, explanation: "發送者欄位是封包自己帶來的宣告。ARP 本身沒有簽章或密碼驗證，這也是信任邊界的重要線索。" },
  { level: "ROUND 3 · 追查快取", question: "小安的快取被錯誤更新成 192.168.1.25 → CC:99。下一個資料封包的 IP 目的地仍是小晴；外層 MAC 目的地會變成什麼？", choices: ["BB:25，IP 會自動修正快取", "CC:99，因為小安照快取選目的 MAC", "FF:FF:FF:FF:FF:FF，每次資料都廣播"], answer: 1, explanation: "快取把 IP 映到 CC:99，所以同網段乙太網路封包可能送到陌生裝置；IP 目的地依然是 192.168.1.25。" },
  { level: "ROUND 3 · 追查快取", question: "陌生裝置收到誤送流量後，若偷偷轉送到小晴，可能形成哪種情況？若直接丟掉呢？", choices: ["轉送可能是中間人路徑；丟掉可能造成阻斷服務", "兩種情況都只是 DNS 快取變慢", "轉送會自動證明 ARP 封包是真的"], answer: 0, explanation: "轉送可能讓攻擊者夾在雙方之間；不轉送則連線可能中斷。HTTPS 能保護內容完整性與機密性，但不能修復錯誤的 ARP 對照。" },
  { level: "ROUND 4 · 防禦判斷", question: "交換器的 Dynamic ARP Inspection（DAI）主要怎麼幫忙？", choices: ["把每個網站自動改成 HTTPS", "把 ARP 配對和可信的 DHCP Snooping 紀錄或 ARP ACL 比對", "讓所有電腦永遠不使用 ARP"], answer: 1, explanation: "DAI 可檢查受保護連接埠進來的 IP/MAC 配對並丟棄不合理封包。它需要正確的綁定資料和交換器設定，不是所有網路都自動有。" },
  { level: "ROUND 4 · 防禦判斷", question: "新裝置想確認 192.168.1.40 有沒有人使用，送出 ARP Probe 時 sender IP 會填什麼？", choices: ["0.0.0.0，表示自己還沒正式使用這個 IP", "192.168.1.40，表示已經確定是自己的", "255.255.255.255，代表所有目標 IP"], answer: 0, explanation: "RFC 5227 定義的 ARP Probe 會把 sender IP 設為 0.0.0.0，再詢問候選 IP 是否已有人使用。這是 ARP 的另一個用途：偵測位址衝突。" }
];
let quizIndex = 0;
let quizScore = 0;
let answered = false;
let quizFinished = false;
const quizCount = document.querySelector("#quiz-count");
const quizQuestion = document.querySelector("#quiz-question");
const quizOptions = document.querySelector("#quiz-options");
const quizFeedback = document.querySelector("#quiz-feedback");
const quizNext = document.querySelector("#quiz-next");
const quizLevel = document.querySelector("#quiz-level");
const quizDots = document.querySelector(".quiz-dots");
quizDots.replaceChildren(...quiz.map((_, i) => {
  const dot = document.createElement("i");
  if (i === 0) dot.classList.add("current");
  dot.setAttribute("aria-hidden", "true");
  return dot;
}));

function renderQuiz() {
  const item = quiz[quizIndex];
  quizCount.textContent = `題目 ${quizIndex + 1} / ${quiz.length}`;
  document.querySelectorAll(".quiz-dots i").forEach((dot, i) => dot.classList.toggle("current", i === quizIndex));
  quizLevel.textContent = item.level;
  quizQuestion.textContent = item.question;
  quizOptions.replaceChildren();
  quizFeedback.hidden = true;
  quizNext.hidden = true;
  answered = false;
  quizFinished = false;
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
  if (quizFinished) {
    quizIndex = 0;
    quizScore = 0;
    renderQuiz();
    return;
  }
  if (quizIndex < quiz.length - 1) {
    quizIndex += 1;
    renderQuiz();
    return;
  }
  if (quizIndex === quiz.length - 1) {
    quizFinished = true;
    quizQuestion.textContent = quizScore >= 9 ? "封包判讀高手！" : quizScore >= 6 ? "很棒，你已經抓到 ARP 的關鍵了！" : "挑戰完成，再來一次會更熟。";
    quizOptions.replaceChildren();
    quizFeedback.textContent = `你答對 ${quizScore} / ${quiz.length} 題。記住三個核心：ARP 只找本地鏈路的下一跳 MAC；Request 廣播、Reply 通常單點回覆；收到的 IP/MAC 聲明沒有 ARP 身分驗證。`;
    quizFeedback.hidden = false;
    quizNext.textContent = "再挑戰一次";
    quizNext.hidden = false;
  }
});

renderQuiz();
}
