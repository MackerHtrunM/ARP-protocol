"""Python API for the ARP Explorer quiz. No personal data is collected."""

from __future__ import annotations

import os
import time
from typing import Annotated
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="ARP 小小網路探險隊 API", version="1.0.0")

origins = [
    item.strip()
    for item in os.getenv(
        "ALLOWED_ORIGINS",
        "https://mackerhtrunm.github.io,http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# The server owns the answer key and explanations; clients only submit an index.
ANSWER_KEY = [0, 1, 2, 1, 1, 0, 1, 0, 1, 0]
EXPLANATIONS = [
    "乙太網路目的 MAC 用 FF:FF:FF:FF:FF:FF 廣播；00:00… 是 ARP 內容中的目標硬體地址未知值，兩個欄位不要混在一起。",
    "全 00 表示 ARP 還不知道目標網卡的 MAC。外層乙太網路目的地才是 FF:FF:FF:FF:FF:FF。",
    "IP 目的位址仍是 192.168.1.25；同一個區網上的乙太網路目的 MAC 是 BB:25。這就是兩層地址分工。",
    "路由器會一站一站轉送。小安先用 ARP 找本地預設閘道的 MAC，ARP 廣播不會穿越路由器。",
    "RFC 826 定義 1 是 Request、2 是 Reply。一般 IPv4 資料不會使用 ARP opcode。",
    "發送者欄位是封包自己帶來的宣告。ARP 本身沒有簽章或密碼驗證，這也是信任邊界的重要線索。",
    "快取把 IP 映到 CC:99，所以同網段乙太網路封包可能送到陌生裝置；IP 目的地依然是 192.168.1.25。",
    "轉送可能讓攻擊者夾在雙方之間；不轉送則連線可能中斷。HTTPS 能保護內容完整性與機密性，但不能修復錯誤的 ARP 對照。",
    "DAI 可檢查受保護連接埠進來的 IP/MAC 配對並丟棄不合理封包。它需要正確的綁定資料和交換器設定，不是所有網路都自動有。",
    "RFC 5227 定義的 ARP Probe 會把 sender IP 設為 0.0.0.0，再詢問候選 IP 是否已有人使用。這是 ARP 的另一個用途：偵測位址衝突。",
]
QUIZ_LENGTH = len(ANSWER_KEY)
SESSION_TTL_SECONDS = 30 * 60
MAX_SESSIONS = 1000
sessions: dict[str, dict[str, int | float]] = {}


class StartQuizResponse(BaseModel):
    session_id: str
    question_count: int


class SubmitAnswer(BaseModel):
    session_id: Annotated[str, Field(min_length=36, max_length=36)]
    question_index: Annotated[int, Field(ge=0, lt=QUIZ_LENGTH)]
    choice_index: Annotated[int, Field(ge=0, le=2)]


def prune_sessions() -> None:
    now = time.time()
    expired = [
        session_id
        for session_id, session in sessions.items()
        if now - float(session["updated_at"]) > SESSION_TTL_SECONDS
    ]
    for session_id in expired:
        sessions.pop(session_id, None)
    if len(sessions) >= MAX_SESSIONS:
        oldest = sorted(sessions, key=lambda key: float(sessions[key]["updated_at"]))
        for session_id in oldest[: len(sessions) - MAX_SESSIONS + 1]:
            sessions.pop(session_id, None)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "arp-quiz-api"}


@app.post("/api/quiz/start", response_model=StartQuizResponse)
def start_quiz() -> StartQuizResponse:
    prune_sessions()
    session_id = str(uuid4())
    sessions[session_id] = {"score": 0, "answered": 0, "updated_at": time.time()}
    return StartQuizResponse(session_id=session_id, question_count=QUIZ_LENGTH)


@app.post("/api/quiz/answer")
def submit_answer(payload: SubmitAnswer) -> dict[str, int | bool | str]:
    prune_sessions()
    session = sessions.get(payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="測驗已過期，請重新開始。")
    expected_question = int(session["answered"])
    if payload.question_index != expected_question:
        raise HTTPException(status_code=409, detail="題目順序不符，請重新開始測驗。")

    correct_index = ANSWER_KEY[payload.question_index]
    is_correct = payload.choice_index == correct_index
    session["score"] = int(session["score"]) + int(is_correct)
    session["answered"] = expected_question + 1
    session["updated_at"] = time.time()
    return {
        "is_correct": is_correct,
        "correct_choice_index": correct_index,
        "explanation": EXPLANATIONS[payload.question_index],
        "score": int(session["score"]),
        "answered_count": int(session["answered"]),
        "complete": int(session["answered"]) == QUIZ_LENGTH,
    }


@app.get("/api/quiz/result/{session_id}")
def quiz_result(session_id: str) -> dict[str, int | str]:
    prune_sessions()
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="測驗已過期，請重新開始。")
    if int(session["answered"]) < QUIZ_LENGTH:
        raise HTTPException(status_code=409, detail="請先完成所有題目。")
    return {"score": int(session["score"]), "total": QUIZ_LENGTH}
