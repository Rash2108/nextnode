import { useState, useEffect, useRef, Fragment } from "react";
import { useLocation } from "react-router-dom";



// ─── CONFIG ────────────────────────────────────────────────────────────────────
const VALID_TOKENS = ["LEE", "VAULT_OMEGA_PRIME", "CTF{g33ks_hunt3r_m4st3r_2024}"];
const NEXT_TOKEN = "FINAL_VAULT_X9";
const MAX_ATTEMPTS = 3;
const TIME_LIMIT = 30 * 60;
const SK = "cc_session_v3";

// ─── SCORE FORMULA ─────────────────────────────────────────────────────────────
// Score per attempt  = accuracy_points + speed_bonus
//   accuracy_points  = (correct / 10) * 80          → max 80
//   speed_bonus      = max(0, (1 - timeUsed/TIME_LIMIT)) * 20 → max 20
//   total per attempt = max 100
//
// Final score across all attempts uses best-attempt logic:
//   final = bestAttemptScore − penalty
//   penalty = (attemptNumber − 1) * 5   (−5 for each retry beyond the first)
//   min final = 0
//
// Example: 100% on first try in 10 min → accuracy 80 + speed ~13.3 = 93.3 → final 93
// Example: 100% on second try → 93 − 5 = 88

// function calcAttemptScore(correctCount, timeUsed) {
//   const acc = (correctCount / QUESTIONS.length) * 80;
//   const speed = Math.max(0, (1 - timeUsed / TIME_LIMIT)) * 20;
//   return Math.round(acc + speed); 
// }

function calcAttemptScore(correctCount, timeUsed, submittedCode, expectedCode) {
  let score = correctCount * 2.5;
  if (submittedCode && expectedCode && submittedCode !== expectedCode) {
    score -= 2.5;
  }
  return Math.max(0, Math.round(score * 10) / 10);
}

function calcFinalScore(attempts) {
  if (!attempts.length) return 0;
  return attempts[attempts.length - 1].score;
}

// ─── QUESTIONS ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    typeQ: "noSnippet",
    text: "The reallocation of production toward high-margin HBM for AI has primarily caused shortages and price surges in which standard memory types?",
    image: "https://assets.micron.com/adobe/assets/urn:aaid:aem:66256fd0-4c98-4c66-b0cb-10987c1ee3bf/as/20250617-micron-logo-on-manassas-building.jpg?width=1500&preferwebp=true",
    options: ["SRAM only", "DRAM and NAND", "ROM and Cache", "VRAM exclusively"],
    correct: 1,
    category: "Recent Tech News",
  },
  {
    id: 2,
    typeQ: "noSnippet",
    text: "Which tool translates the entire source code of a program into machine code before execution?",
    image: null,
    options: ["Assembler", "Interpreter", "Linker", "Compiler"],
    correct: 3,
    category: "Programming Concepts",
  },
  {
    id: 3,
    typeQ: "noSnippet",
    text: "In March 2026, what term exploded as a viral meme mocking Microsoft's heavy AI push after CEO Satya Nadella criticized calling AI content 'slop'?",
    image: "https://thunderdungeon.com/wp-content/uploads/2026/01/microslop-memes-3-20260107.jpg",
    options: ["AI Sludge", "Microslop", "Nadella Nonsense", "Copilot Crud"],
    correct: 1,
    category: "Recent Tech News",
  },
  {
    id: 4,
    typeQ: "snippet",
    code: "console.log(typeof null);",
    text: "What is logged?",
    options: ["null", "object", "undefined", "number"],
    correct: 1,
    category: "Snippet",
  },
  {
    id: 5,
    typeQ: "snippet",
    code: "let x = 5;\n(function() {\n  console.log(x);\n  let x = 10;\n})();",
    text: "What happens?",
    options: ["5", "10", "undefined", "ReferenceError"],
    correct: 3,
    category: "Snippet",
  },
  {
    id: 6,
    typeQ: "snippet",
    code: "console.log(0 == false);",
    text: "What is the output?",
    options: ["true", "false", "undefined", "Error"],
    correct: 0,
    category: "Snippet",
  },
  {
    id: 7,
    typeQ: "snippet",
    code: "let a = {};\nlet b = a;\nb.name = 'XLO';\nconsole.log(a.name);",
    text: "What is logged?",
    options: ["undefined", "XLO", "Error", "null"],
    correct: 1,
    category: "Snippet",
  },
  {
    id: 8,
    typeQ: "noSnippet",
    text: "Which data structure uses FIFO (First In, First Out) principle?",
    image: null,
    options: ["Stack", "Queue", "Tree", "Graph"],
    correct: 1,
    category: "Programming Concepts",
  },
  {
    id: 9,
    typeQ: "noSnippet",
    text: "Which programming paradigm focuses on objects and their interactions?",
    image: null,
    options: ["Functional Programming", "Procedural Programming", "Object-Oriented Programming", "Logic Programming"],
    correct: 2,
    category: "Programming Concepts",
  },
  {
    id: 10,
    typeQ: "snippet",
    code: "console.log([] == false);",
    text: "What is the output?",
    options: ["true", "false", "undefined", "Error"],
    correct: 0,
    category: "Snippet",
  }
];

// DRAM and NAND[2]=A  Compiler[2]=M  Microslop[2]=C  RAM[2]=M  Three decades[2]=R
// Linux[2]=N  Boolean[2]=O  Syntax Error[2]=N  Array[2]=R  Debug[2]=B
// → "AMCMRNONRB"
// const CORRECT_CODE = QUESTIONS.map(q => q.options[q.correct][2].toUpperCase()).join("");
const CORRECT_CODE = QUESTIONS.map(q => {
  const opt = q.options[q.correct];

  if (!opt) return "?";

  const str = String(opt); // handles numbers too
  return str[2] ? str[2].toUpperCase() : "?";
}).join("");

// Build the "expected" code from the user's own chosen answers
// If this equals CORRECT_CODE but their submitted code does not → pure typo
function buildExpectedCode(chosen) {
  return QUESTIONS.map((q, i) => {
    const ci = chosen[i];
    if (ci === null || ci === -1) return "?";
    const opt = q.options[ci];
    return opt[2] ? opt[2].toUpperCase() : "?";
  }).join("");
}

// ─── SESSION PERSISTENCE ───────────────────────────────────────────────────────
// attemptLog: [{ attemptNo, correctCount, pct, timeUsed, score, won, submittedCode, expectedCode, ts }]
const DEFAULT = {
  phase: "gate",
  authed: false,
  attempts: 0,
  timeLeft: TIME_LIMIT,
  attemptStart: null,   // Date.now() when current attempt started
  chosen: Array(10).fill(null),
  timedOut: false,
  finalCode: "",
  attemptLog: [],       // history of all attempts
};

const syncToServer = async (session) => {
  try {
    const teamName = localStorage.getItem("teamName") || "Unknown Team";
    const finalScore = session.attemptLog ? calcFinalScore(session.attemptLog) : 0;

    const payload = {
      teamName: teamName,
      finalScore: finalScore,
      ...session,
      timeLeft: typeof session.timeLeft === "number" ? fmtTime(session.timeLeft) : session.timeLeft,
      attemptLog: session.attemptLog ? session.attemptLog.map(a => ({
        ...a,
        timeUsed: typeof a.timeUsed === "number" ? fmtTime(a.timeUsed) : a.timeUsed
      })) : []
    };

    await fetch(`${import.meta.env.VITE_API_URL}/api/round1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log(session);
    console.log(teamName);
  } catch (err) {
    console.error("Sync failed", err);
  }
};

// function loadSess() {
//   try {
//     const raw = localStorage.getItem(SK);
//     if (!raw) return { ...DEFAULT };
//     const p = JSON.parse(raw);
//     if (!Array.isArray(p.chosen) || p.chosen.length !== 10) p.chosen = Array(10).fill(null);
//     if (!Array.isArray(p.attemptLog)) p.attemptLog = [];
//     syncToServer()
//     return { ...DEFAULT, ...p };
//   } catch { return { ...DEFAULT }; }
// }

// function loadSess() {
//   try {
//     const raw = localStorage.getItem(SK);
//     if (!raw) return { ...DEFAULT };

//     const p = JSON.parse(raw);

//     if (!Array.isArray(p.chosen) || p.chosen.length !== 10)
//       p.chosen = Array(10).fill(null);

//     if (!Array.isArray(p.attemptLog))
//       p.attemptLog = [];

//     const session = { ...DEFAULT, ...p };

//     syncToServer(session); // ✅ send correct data

//     return session;
//   } catch {
//     return { ...DEFAULT };
//   }
// }

function loadSess() {
  try {
    const raw = localStorage.getItem(SK);
    if (!raw) return { ...DEFAULT };

    let parsed = JSON.parse(raw);

    // 🔥 fix double-stringified issue
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    if (!Array.isArray(parsed.chosen) || parsed.chosen.length !== 10)
      parsed.chosen = Array(10).fill(null);

    if (!Array.isArray(parsed.attemptLog))
      parsed.attemptLog = [];

    const session = { ...DEFAULT, ...parsed };

    syncToServer(session);

    return session;
  } catch (err) {
    console.error("Parse error:", err);
    return { ...DEFAULT };
  }
}
function saveSess(s) { try { localStorage.setItem(SK, JSON.stringify(s)); } catch { } }

// ─── STYLES ────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020406;--s1:#05080e;--s2:#080d16;
  --border:#0d1a28;--border2:#142030;
  --cyan:#00e5ff;--green:#00ff9f;--amber:#ffb300;
  --red:#ff3d5a;--purple:#b44fff;
  --text:#a8c8e0;--dim:#243850;--dimmer:#0c1820;
}
html,body{background:var(--bg);font-family:'Rajdhani',sans-serif;color:var(--text)}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9000;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.012) 3px,rgba(0,0,0,.012) 4px)}
input,button{font-family:inherit}
input::placeholder{color:var(--dimmer);font-size:12px;letter-spacing:1px}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{to{transform:translateX(200%)}}
@keyframes glitch{0%,92%,100%{clip-path:none;transform:none}93%{clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%);transform:translateX(-3px)}95%{clip-path:polygon(0 65%,100% 65%,100% 80%,0 80%);transform:translateX(3px)}97%{clip-path:none;transform:none}}
@keyframes optionIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes countPulse{0%,100%{color:var(--red);text-shadow:0 0 16px var(--red)}50%{color:#ff8090;text-shadow:0 0 30px var(--red)}}
@keyframes codeChar{from{opacity:0;transform:scale(.6) translateY(4px)}to{opacity:1;transform:none}}
@keyframes lockedWiggle{0%{transform:rotate(0)}25%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}75%{transform:rotate(-4deg)}100%{transform:rotate(0)}}
@keyframes successGlow{0%,100%{box-shadow:0 0 20px rgba(180,79,255,.2)}50%{box-shadow:0 0 60px rgba(180,79,255,.5)}}
@keyframes barFill{from{width:0}to{width:var(--w)}}
`;

function injectStyles() {
  if (document.getElementById("cc-styles")) return;
  const s = document.createElement("style"); s.id = "cc-styles"; s.textContent = STYLES;
  document.head.appendChild(s);
}
function fmtTime(s) {
  const m = Math.floor(Math.max(0, s) / 60), sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── SHARED UI ─────────────────────────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "55px 55px", opacity: .22 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(0,229,255,.04) 0%,transparent 55%),radial-gradient(ellipse at 80% 90%,rgba(255,179,0,.03) 0%,transparent 50%)" }} />
    </div>
  );
}
function Corner({ color = "var(--cyan)" }) {
  const b = { position: "absolute", width: 11, height: 11, borderColor: color, borderStyle: "solid", opacity: .5 };
  return (<>
    <span style={{ ...b, top: 7, left: 7, borderWidth: "1px 0 0 1px" }} />
    <span style={{ ...b, top: 7, right: 7, borderWidth: "1px 1px 0 0" }} />
    <span style={{ ...b, bottom: 7, left: 7, borderWidth: "0 0 1px 1px" }} />
    <span style={{ ...b, bottom: 7, right: 7, borderWidth: "0 1px 1px 0" }} />
  </>);
}

// ─── SCORE CARD ────────────────────────────────────────────────────────────────
// Renders a single attempt row in the history table
function AttemptRow({ entry, isBest }) {
  const accColor = entry.pct >= 70 ? "var(--green)" : entry.pct >= 40 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "60px 1fr 90px 80px",
      gap: 10, alignItems: "center",
      background: isBest ? "rgba(0,255,159,.04)" : "var(--bg)",
      border: `1px solid ${isBest ? "var(--green)" : "var(--border2)"}`,
      borderRadius: 5, padding: "10px 14px",
      animation: "fadeUp .3s ease",
    }}>
      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: "var(--dim)", letterSpacing: 1 }}>
        #{entry.attemptNo} {isBest && <span style={{ color: "var(--green)", fontSize: 8 }}>★</span>}
      </span>
      {/* Accuracy bar */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 6, background: "var(--dimmer)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${entry.pct}%`, background: accColor, borderRadius: 3, transition: "width 1s ease", boxShadow: `0 0 6px ${accColor}88` }} />
        </div>
        <span style={{ fontSize: 10, color: accColor, fontFamily: "'Share Tech Mono',monospace", marginTop: 3, display: "block" }}>{entry.pct}% correct</span>
      </div>
      {/* Time used */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: "var(--cyan)" }}>{fmtTime(entry.timeUsed)}</div>
        <div style={{ fontSize: 9, color: "var(--dim)", letterSpacing: 1 }}>TIME USED</div>
      </div>

      {/* Won / typo / miss badge */}
      <div style={{ textAlign: "center" }}>
        {entry.won
          ? <span style={{ fontSize: 10, color: "var(--green)", border: "1px solid var(--green)", borderRadius: 3, padding: "2px 6px", letterSpacing: 1 }}>✓ WON</span>
          : entry.expectedCode === CORRECT_CODE && entry.submittedCode !== CORRECT_CODE
            ? <span style={{ fontSize: 10, color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 3, padding: "2px 6px", letterSpacing: 1 }}>⌨ TYPO</span>
            : <span style={{ fontSize: 10, color: "var(--red)", border: "1px solid var(--border2)", borderRadius: 3, padding: "2px 6px", letterSpacing: 1 }}>✗ WRONG</span>}
      </div>
    </div>
  );
}


function calcCodeAccuracy(submitted, expected) {
  if (!submitted) return 0;
  let match = 0;

  for (let i = 0; i < expected.length; i++) {
    if (submitted[i] === expected[i]) match++;
  }

  return match / expected.length; // 0 → 1
}

// Full score panel used in CodeEntry (after wrong), EndScreen, WinScreen
function ScorePanel({ attemptLog, currentEntry, compact = false }) {
  const allEntries = currentEntry ? [...attemptLog.filter(a => a.attemptNo !== currentEntry.attemptNo), currentEntry] : attemptLog;
  if (!allEntries.length) return null;

  const bestScore = Math.max(...allEntries.map(a => a.score));
  const bestEntry = allEntries.find(a => a.score === bestScore);
  const finalScore = calcFinalScore(allEntries);

  const finalColor = finalScore >= 40 ? "var(--green)" : finalScore >= 25 ? "var(--amber)" : "var(--red)";
  const grade = finalScore >= 45 ? "S" : finalScore >= 40 ? "A" : finalScore >= 30 ? "B" : finalScore >= 20 ? "C" : "D";
  const gradeColor = finalScore >= 45 ? "var(--green)" : finalScore >= 40 ? "var(--cyan)" : finalScore >= 20 ? "var(--amber)" : "var(--red)";

  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 8, padding: compact ? 16 : 22, animation: "fadeUp .4s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 4, color: "var(--dim)", marginBottom: 6 }}>PERFORMANCE REPORT</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: compact ? 13 : 15, fontWeight: 900, color: "var(--amber)", letterSpacing: 3 }}>ATTEMPT HISTORY</div>
        </div>
        {/* Final score badge */}
        <div style={{ textAlign: "center", background: "var(--bg)", border: "1px solid var(--amber)", borderRadius: 8, padding: "10px 18px", minWidth: 90 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, color: "var(--amber)", letterSpacing: 1, lineHeight: 1.6 }}>MARKS WILL BE<br/>ANNOUNCED SHORTLY</div>
        </div>
      </div>

      {/* Attempt rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {allEntries.map(e => (
          <AttemptRow key={e.attemptNo} entry={e} isBest={e.attemptNo === bestEntry.attemptNo} />
        ))}
      </div>

      {/* Per-attempt code comparison (only for non-win entries that have submittedCode) */}


    </div>
  );
}

// ─── ACCESS GATE ───────────────────────────────────────────────────────────────
function AccessGate({ attempts, attemptLog, onAuth }) {
  const [team, setTeam] = useState(() => localStorage.getItem("teamName") || "");
  const [err, setErr] = useState(false);

  const go = () => {
    if (!team.trim()) { setErr(true); return; }
    localStorage.setItem("teamName", team.trim());
    onAuth();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeUp .7s ease" }}>
      <p style={{ fontSize: 10, letterSpacing: 6, color: "var(--dim)", marginBottom: 14, textAlign: "center" }}>◈ VIRTUAL TREASURE HUNT · FINAL QUALIFYING ROUND ◈</p>
      <h1 style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "clamp(22px,5vw,54px)", letterSpacing: 7, color: "var(--purple)", textShadow: "0 0 40px rgba(180,79,255,.5)", textAlign: "center", marginBottom: 8, position: "relative" }}>
        CODE CRACKER
        <span style={{ position: "absolute", inset: 0, color: "var(--red)", animation: "glitch 4s infinite", pointerEvents: "none" }} aria-hidden>CODE CRACKER</span>
      </h1>
      <p style={{ fontSize: 11, fontFamily: "'Share Tech Mono',monospace", color: "var(--dim)", letterSpacing: 3, textAlign: "center", marginBottom: 36 }}>
        10 QUESTIONS · 30 MINUTES · {MAX_ATTEMPTS} ATTEMPTS MAX
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 26, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2, color: "var(--dim)" }}>ATTEMPTS USED:</span>
        {Array(MAX_ATTEMPTS).fill(0).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < attempts ? "var(--red)" : "var(--dimmer)", boxShadow: i < attempts ? "0 0 8px var(--red)" : "none", border: "1px solid var(--border2)", transition: "all .3s" }} />
        ))}
        <span style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", color: attempts >= MAX_ATTEMPTS ? "var(--red)" : "var(--dim)", letterSpacing: 1 }}>{attempts}/{MAX_ATTEMPTS}</span>
      </div>

      <div style={{ background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 8, padding: "32px 38px", width: "100%", maxWidth: 500, position: "relative", animation: err ? "shake .5s ease" : "none" }}>
        <Corner color="var(--purple)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
          {[["⏱", "30 MIN", "Time Limit"], ["❓", "10", "Questions"], ["🔄", MAX_ATTEMPTS, "Max Attempts"], ["🔑", "3rd CHAR", "Your Code Key"]].map(([icon, v, label]) => (
            <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 5, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: "var(--purple)", letterSpacing: 1 }}>{v}</div>
              <div style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "var(--dim)", letterSpacing: 1, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid rgba(180,79,255,.2)", borderLeft: "2px solid var(--purple)", borderRadius: 4, padding: "10px 14px", marginBottom: 20, fontSize: 12, lineHeight: 1.9, color: "var(--text)", opacity: .85 }}>
          Answer all 10 questions — <strong style={{ color: "var(--purple)" }}>no going back</strong>. After Q10, take the <strong style={{ color: "var(--amber)" }}>3rd character</strong> of each answer in order and enter the resulting 10-character code. One wrong answer = wrong code.
        </div>

        {/* Show history if returning after a failed attempt */}
        {attemptLog.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <ScorePanel attemptLog={attemptLog} compact={true} />
          </div>
        )}

        <p style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 3, color: "var(--dim)", marginBottom: 10 }}>// ENTER TEAM NAME</p>
        <input value={team} onChange={e => { setTeam(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && go()}
          placeholder="Team Name..." autoComplete="off" spellCheck={false}
          style={{ width: "100%", background: "var(--bg)", border: `1px solid ${err ? "var(--red)" : "var(--border2)"}`, borderRadius: 4, padding: "13px 16px", color: "var(--purple)", fontFamily: "'Share Tech Mono',monospace", fontSize: 14, letterSpacing: 2, outline: "none", marginBottom: 20, transition: "border-color .2s" }}
        />
        <button onClick={go} style={{ width: "100%", background: "transparent", border: "1px solid var(--purple)", borderRadius: 4, padding: 13, color: "var(--purple)", fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 4, cursor: "pointer", position: "relative", overflow: "hidden" }}>
          BEGIN CHALLENGE ▶
          <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(180,79,255,.1),transparent)", transform: "translateX(-200%)", animation: "shimmer 2.5s infinite" }} />
        </button>
      </div>
    </div>
  );
}


// ─── QUIZ SCREEN ───────────────────────────────────────────────────────────────
function QuizScreen({ timeLeft, chosen, onAnswer, onFinish }) {
  const startIdx = chosen.filter(c => c !== null).length;
  const [qIdx, setQIdx] = useState(Math.min(startIdx, QUESTIONS.length - 1));
  const [pending, setPending] = useState(null);
  const [trans, setTrans] = useState(false);

  const [showCode, setShowCode] = useState(true);
  const [timer, setTimer] = useState(10);
  const [selected, setSelected] = useState(null);

  const q = QUESTIONS[qIdx];

  useEffect(() => {
    if (!showCode) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowCode(false);
          return 10;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showCode]);

  // Reset when new question comes
  useEffect(() => {
    setShowCode(true);
    setTimer(10);
    setSelected(null);
  }, [q]);

  useEffect(() => {
    if (q.typeQ !== "snippet") return;

    setShowCode(true);
    setTimer(10); // reset for each snippet

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowCode(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qIdx]);


  const isLastQ = qIdx === QUESTIONS.length - 1;
  const OPT = ["A", "B", "C", "D"];

  const handleSelect = (oi) => { if (!trans) setPending(oi); };

  const handleNext = () => {
    if (pending === null || trans) return;
    onAnswer(qIdx, pending);
    if (!isLastQ) {
      setTrans(true); setPending(null);
      setTimeout(() => { setQIdx(qIdx + 1); setTrans(false); }, 350);
    } else {
      const finalChosen = [...chosen]; finalChosen[qIdx] = pending;
      onFinish(finalChosen, false);
    }
  };

  const timerColor = timeLeft <= 60 ? "var(--red)" : timeLeft <= 300 ? "var(--amber)" : "var(--cyan)";
  const timerAnim = timeLeft <= 60 ? "countPulse .5s infinite" : "none";
  const progress = (qIdx / QUESTIONS.length) * 100;
  const displayChosen = [...chosen]; if (pending !== null) displayChosen[qIdx] = pending;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "0 20px 40px", animation: "fadeIn .4s ease" }}>
      {/* HUD */}
      <div style={{ position: "sticky", top: 0, zIndex: 500, background: "rgba(2,4,6,.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border2)", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 900, color: "var(--purple)", letterSpacing: 3 }}>CODE CRACKER</span>
        <div style={{ width: 1, height: 22, background: "var(--border2)" }} />
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 700, color: timerColor, animation: timerAnim, letterSpacing: 2, minWidth: 75 }}>{fmtTime(timeLeft)}</div>
        <div style={{ width: 1, height: 22, background: "var(--border2)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 120 }}>
          <div style={{ flex: 1, height: 3, background: "var(--dimmer)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,var(--purple),var(--cyan))", transition: "width .5s ease", borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap" }}>{qIdx}/{QUESTIONS.length}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: displayChosen[i] !== null ? "var(--green)" : i === qIdx ? "var(--purple)" : "var(--dimmer)",
              boxShadow: i === qIdx ? "0 0 8px var(--purple)" : displayChosen[i] !== null ? "0 0 5px var(--green)" : "none",
              transition: "all .3s"
            }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
        {q.typeQ !== "snippet" ? (
          <div style={{ width: "100%", maxWidth: 720, background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 10, padding: "32px", position: "relative", overflow: "hidden", opacity: trans ? 0 : 1, transform: trans ? "translateX(20px)" : "none", transition: "opacity .35s,transform .35s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--purple),var(--cyan),transparent)" }} />
            <Corner color="var(--purple)" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 3, color: "var(--dim)", background: "var(--bg)", border: "1px solid var(--border2)", padding: "3px 10px", borderRadius: 3 }}>{q.category.toUpperCase()}</span>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: "var(--purple)", letterSpacing: 2, fontWeight: 700 }}>Q{qIdx + 1} / {QUESTIONS.length}</span>
            </div>
            <h2 style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 600, color: "var(--text)", lineHeight: 1.7, marginBottom: 24, letterSpacing: .3 }}>{q.text}</h2>
            {q.image && (
              <div style={{ marginBottom: 20, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border2)" }}>
                <img src={q.image} alt="visual" style={{ width: "100%", maxHeight: 240, objectFit: "contain", background: "var(--bg)" }} onError={e => { e.target.style.display = "none" }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, oi) => {
                const sel = pending === oi;
                return (
                  <button key={oi} onClick={() => handleSelect(oi)} disabled={trans}
                    style={{ display: "flex", alignItems: "center", gap: 14, background: sel ? "rgba(180,79,255,.14)" : "rgba(255,255,255,.018)", border: `1px solid ${sel ? "var(--purple)" : "var(--border2)"}`, borderRadius: 6, padding: "13px 18px", cursor: trans ? "not-allowed" : "pointer", textAlign: "left", width: "100%", boxShadow: sel ? "0 0 22px rgba(180,79,255,.18)" : "none", transition: "background .18s,border-color .18s,box-shadow .18s", animation: `optionIn .35s ease ${oi * 60}ms both` }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = "rgba(180,79,255,.5)" }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = "var(--border2)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: sel ? "var(--purple)" : "var(--dimmer)", border: `1px solid ${sel ? "var(--purple)" : "var(--border2)"}`, fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: sel ? "#fff" : "var(--dim)", transition: "all .2s" }}>{OPT[oi]}</div>
                    <span style={{ fontSize: 15, fontWeight: sel ? 600 : 500, color: sel ? "#fff" : "var(--text)", letterSpacing: .3, flex: 1 }}>{opt}</span>
                    {sel && <span style={{ color: "var(--green)", fontSize: 18, flexShrink: 0 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontFamily: "'Share Tech Mono',monospace", color: "var(--dim)" }}>
                <span style={{ color: "var(--amber)" }}>⚠</span>
                <span>{pending === null ? "Select an option to continue." : "Happy with your choice? Click Next to lock it in — no going back."}</span>
              </div>
              <button onClick={handleNext} disabled={pending === null || trans}
                style={{ background: pending !== null ? "var(--purple)" : "var(--dimmer)", border: `1px solid ${pending !== null ? "var(--purple)" : "var(--border2)"}`, borderRadius: 6, padding: "11px 26px", color: pending !== null ? "#fff" : "var(--dim)", fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, cursor: pending !== null ? "pointer" : "not-allowed", transition: "all .25s", boxShadow: pending !== null ? "0 0 20px rgba(180,79,255,.3)" : "none", flexShrink: 0, opacity: pending !== null ? 1 : .5 }}>
                {isLastQ ? "SUBMIT ANSWERS ▶" : "NEXT QUESTION →"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 720, background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 10, padding: "32px", position: "relative", overflow: "hidden", opacity: trans ? 0 : 1, transform: trans ? "translateX(20px)" : "none", transition: "opacity .35s,transform .35s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--purple),var(--cyan),transparent)" }} />
            <Corner color="var(--purple)" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 3, color: "var(--dim)", background: "var(--bg)", border: "1px solid var(--border2)", padding: "3px 10px", borderRadius: 3 }}>{q.category.toUpperCase()}</span>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: "var(--purple)", letterSpacing: 2, fontWeight: 700 }}>Q{qIdx + 1} / {QUESTIONS.length}</span>
            </div>
            <h2 style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 600, color: "var(--text)", lineHeight: 1.7, marginBottom: 24, letterSpacing: .3 }}>{q.text}</h2>

            {q.typeQ === "snippet" && showCode && (
              <div>
                <p style={{ marginBottom: 10, color: "var(--amber)" }}>
                  Memorize the snippet... ({timer}s)
                </p>

                <div
                  style={{
                    marginBottom: 20,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border2)",
                    background: "#0f172a",
                    color: "#e5e7eb",
                    padding: "16px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    <code>{q.code}</code>
                  </pre>
                </div>
              </div>
            )}
            {!showCode && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.options.map((opt, oi) => {
                    const sel = pending === oi;
                    return (
                      <button key={oi} onClick={() => handleSelect(oi)} disabled={trans}
                        style={{ display: "flex", alignItems: "center", gap: 14, background: sel ? "rgba(180,79,255,.14)" : "rgba(255,255,255,.018)", border: `1px solid ${sel ? "var(--purple)" : "var(--border2)"}`, borderRadius: 6, padding: "13px 18px", cursor: trans ? "not-allowed" : "pointer", textAlign: "left", width: "100%", boxShadow: sel ? "0 0 22px rgba(180,79,255,.18)" : "none", transition: "background .18s,border-color .18s,box-shadow .18s", animation: `optionIn .35s ease ${oi * 60}ms both` }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = "rgba(180,79,255,.5)" }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = "var(--border2)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: sel ? "var(--purple)" : "var(--dimmer)", border: `1px solid ${sel ? "var(--purple)" : "var(--border2)"}`, fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: sel ? "#fff" : "var(--dim)", transition: "all .2s" }}>{OPT[oi]}</div>
                        <span style={{ fontSize: 15, fontWeight: sel ? 600 : 500, color: sel ? "#fff" : "var(--text)", letterSpacing: .3, flex: 1 }}>{opt}</span>
                        {sel && <span style={{ color: "var(--green)", fontSize: 18, flexShrink: 0 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontFamily: "'Share Tech Mono',monospace", color: "var(--dim)" }}>
                    <span style={{ color: "var(--amber)" }}>⚠</span>
                    <span>{pending === null ? "Select an option to continue." : "Happy with your choice? Click Next to lock it in — no going back."}</span>
                  </div>
                  <button onClick={handleNext} disabled={pending === null || trans}
                    style={{ background: pending !== null ? "var(--purple)" : "var(--dimmer)", border: `1px solid ${pending !== null ? "var(--purple)" : "var(--border2)"}`, borderRadius: 6, padding: "11px 26px", color: pending !== null ? "#fff" : "var(--dim)", fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, cursor: pending !== null ? "pointer" : "not-allowed", transition: "all .25s", boxShadow: pending !== null ? "0 0 20px rgba(180,79,255,.3)" : "none", flexShrink: 0, opacity: pending !== null ? 1 : .5 }}>
                    {isLastQ ? "SUBMIT ANSWERS ▶" : "NEXT QUESTION →"}
                  </button>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div >
  );
}

// ─── CODE ENTRY ────────────────────────────────────────────────────────────────
function CodeEntry({ chosen, attemptsLeft, timedOut, attemptLog, currentAttemptNo, onSubmit, onRestart }) {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  // locked = true once submit fires (win or wrong) — disables input + button permanently
  const [locked, setLocked] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const topRef = useRef(null);
  const OPT = ["A", "B", "C", "D"];

  // Scroll to top of card whenever the result panel appears
  useEffect(() => {
    if (showPanel && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showPanel]);

  // Also scroll to very top on first mount (phase transition from quiz)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Restore state if user refreshed mid-result (existing wrong entry in log)
  const existingEntry = attemptLog.find(a => a.attemptNo === currentAttemptNo && !a.won);
  useEffect(() => {
    if (existingEntry && !showPanel) {
      setShowPanel(true);
      setLocked(true);
      setCurrentEntry({ pct: existingEntry.pct, correct: existingEntry.correctCount });
    }
  }, []);

  const handleSubmit = () => {
    if (!code.trim() || locked) return;
    const upper = code.trim().toUpperCase();
    setLocked(true); // disable immediately — no double-submit
    if (upper === CORRECT_CODE) {
      onSubmit(true, upper);
    } else {
      const correct = QUESTIONS.filter((q, i) => chosen[i] !== null && chosen[i] !== -1 && chosen[i] === q.correct).length;
      const pct = Math.round((correct / QUESTIONS.length) * 100);
      setCurrentEntry({ pct, correct });
      setShake(true);
      setShowPanel(true);
      setTimeout(() => setShake(false), 600);
      onSubmit(false, upper, correct, pct);
    }
  };

  const entry = currentEntry || (existingEntry ? { pct: existingEntry.pct, correct: existingEntry.correctCount } : null);
  const isLocked = locked || !!existingEntry;

  const feedbackMsg = (pct) => {
    if (pct === 0) return "None of your answers were correct. Review all 10 questions carefully from scratch.";
    if (pct < 40) return `Only ${Math.round(pct / 10)} out of 10 correct. Most answers need rethinking — go back to basics.`;
    if (pct < 70) return `You got roughly ${Math.round(pct / 10)} out of 10 right. A few key answers still need revisiting.`;
    if (pct < 100) return `So close! About ${Math.round(pct / 10)} out of 10 correct. Just ${10 - Math.round(pct / 10)} more to nail.`;
    return "All answers are correct — double-check you're extracting the 3rd character properly (count from 1, not 0).";
  };

  const pctColor = !entry ? "var(--red)" : entry.pct >= 70 ? "var(--amber)" : entry.pct >= 40 ? "var(--amber)" : "var(--red)";

  return (
    // Top-aligned, scrollable — NOT vertically centered, so result panel is never clipped
    <div
      ref={topRef}
      style={{
        minHeight: "100vh",
        height: "auto",          // ✅ allow expansion
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 20px 120px", // ✅ extra bottom space
        overflowY: "auto",       // ✅ allow scroll
      }}
    >
      <div style={{ width: "100%", maxWidth: 700, background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 10, padding: "32px", position: "relative", overflow: "hidden", animation: shake ? "shake .5s ease" : "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--purple),var(--cyan),transparent)" }} />
        <Corner color="var(--amber)" />

        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: "var(--amber)", letterSpacing: 4, marginBottom: 6 }}>
          {timedOut ? "⏱ TIME'S UP" : "⬡ BUILD YOUR CODE"}
        </div>
        <div style={{ fontSize: 13, color: "var(--dim)", fontFamily: "'Share Tech Mono',monospace", letterSpacing: 1, lineHeight: 1.8, marginBottom: 22 }}>
          {timedOut ? "Time expired. Here are your answers — apply the rule to build your code." : "All 10 questions answered. Here's your summary."}
        </div>

        <div style={{ background: "var(--bg)", border: "1px solid rgba(255,179,0,.2)", borderLeft: "2px solid var(--amber)", borderRadius: 4, padding: "12px 16px", marginBottom: 22, fontSize: 13, lineHeight: 1.9, color: "var(--text)" }}>
          📌 <strong style={{ color: "var(--amber)" }}>Rule:</strong> Take the <strong style={{ color: "var(--amber)" }}>3rd character (position 3, counting from 1)</strong> of each answer you chose, Q1 → Q10. Combine all 10 into one code and enter below.
        </div>

        {/* Chosen answers — no chars revealed */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 3, color: "var(--dim)", marginBottom: 12 }}>YOUR CHOSEN ANSWERS (Q1 → Q10):</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
            {chosen.map((ci, qi) => {
              const opt = (ci !== null && ci !== -1) ? QUESTIONS[qi].options[ci] : null;
              const letter = (ci !== null && ci !== -1) ? OPT[ci] : "—";
              return (
                <div key={qi} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 5, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--dim)", letterSpacing: 1, flexShrink: 0, minWidth: 22 }}>Q{qi + 1}</span>
                  <div style={{ width: 26, height: 26, borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(180,79,255,.15)", border: "1px solid var(--purple)", fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color: "var(--purple)" }}>{letter}</div>
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={opt || "—"}>
                    {opt || <span style={{ color: "var(--dim)" }}>Not answered</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input row */}
        <div style={{ fontSize: 10, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 3, color: "var(--dim)", marginBottom: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>ENTER YOUR 10-CHARACTER CODE:</span>
          <span style={{ color: attemptsLeft <= 1 ? "var(--red)" : "var(--amber)" }}>{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={code}
            onChange={e => { if (!isLocked) setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)); }}
            onKeyDown={e => e.key === "Enter" && !isLocked && handleSubmit()}
            placeholder={isLocked ? "— submitted —" : "Type your 10-char code here..."}
            maxLength={10}
            readOnly={isLocked}
            style={{
              flex: 1, minWidth: 160, background: "var(--bg)",
              border: `1px solid ${showPanel ? "var(--red)" : "rgba(255,179,0,.4)"}`,
              borderRadius: 4, padding: "13px 16px",
              color: isLocked ? "var(--dim)" : "var(--amber)",
              fontFamily: "'Orbitron',monospace", fontSize: 16, letterSpacing: 4,
              outline: "none", textTransform: "uppercase", transition: "border-color .2s",
              opacity: isLocked ? 0.6 : 1,
              cursor: isLocked ? "not-allowed" : "text",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLocked || !code.trim()}
            style={{
              background: isLocked ? "var(--dimmer)" : "transparent",
              border: `1px solid ${isLocked ? "var(--border2)" : "var(--amber)"}`,
              borderRadius: 4, padding: "13px 26px",
              color: isLocked ? "var(--dim)" : "var(--amber)",
              fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700,
              letterSpacing: 3,
              cursor: isLocked ? "not-allowed" : "pointer",
              flexShrink: 0, opacity: isLocked ? 0.5 : 1,
              transition: "all .2s",
            }}
          >
            {isLocked ? "SUBMITTED ✓" : "SUBMIT ▶"}
          </button>
        </div>

        {/* Wrong-answer panel — only after failed submit */}
        {showPanel && entry && (
          <div style={{ marginTop: 20, background: "rgba(255,61,90,.05)", border: "1px solid rgba(255,61,90,.25)", borderRadius: 6, padding: "20px 22px", animation: "fadeUp .3s ease" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--red)", marginBottom: 10, letterSpacing: .5 }}>❌ That code doesn't match.</div>

            {/* Inline accuracy meter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "'Share Tech Mono',monospace", letterSpacing: 1 }}>This attempt accuracy:</span>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 900, color: pctColor, textShadow: `0 0 12px ${pctColor}` }}>{entry.pct}%</span>
            </div>
            <div style={{ height: 8, background: "var(--dimmer)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 4, background: pctColor, width: `${entry.pct}%`, transition: "width 1.2s ease", boxShadow: `0 0 8px ${pctColor}` }} />
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", opacity: .85, lineHeight: 1.8, marginBottom: 16 }}>{feedbackMsg(entry.pct)}</div>

            {/* Full score panel with history */}
            <div style={{ marginBottom: 16 }}>
              <ScorePanel attemptLog={attemptLog} currentEntry={attemptLog.find(a => a.attemptNo === currentAttemptNo)} compact={true} />
            </div>

            <div style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'Share Tech Mono',monospace", marginBottom: 16 }}>
              Attempts remaining: <strong style={{ color: attemptsLeft <= 1 ? "var(--red)" : "var(--amber)" }}>{attemptsLeft}</strong>
            </div>
            <button onClick={onRestart}
              style={{ background: "transparent", border: "1px solid var(--purple)", borderRadius: 6, padding: "11px 24px", color: "var(--purple)", fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer", transition: "background .2s,box-shadow .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(180,79,255,.1)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(180,79,255,.2)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none" }}>
              ↺ &nbsp;TRY AGAIN FROM Q1
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── END SCREEN (locked / timed-out) ──────────────────────────────────────────
function EndScreen({ reason, attemptLog }) {
  const isTimeout = reason === "timed-out";
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", animation: "fadeUp .5s ease" }}>
      <div style={{ fontSize: 64, color: "var(--red)", marginBottom: 16, animation: "lockedWiggle 1.2s ease infinite" }}>{isTimeout ? "⏱" : "🔒"}</div>
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(18px,4vw,36px)", fontWeight: 900, color: "var(--red)", letterSpacing: 5, marginBottom: 10, textShadow: "0 0 30px var(--red)" }}>
        {isTimeout ? "TIME EXPIRED" : "ACCESS LOCKED"}
      </div>
      <div style={{ fontSize: 13, fontFamily: "'Share Tech Mono',monospace", color: "var(--dim)", letterSpacing: 1, maxWidth: 440, lineHeight: 2.1, marginBottom: 24 }}>
        {isTimeout
          ? <>Your 30-minute window has closed.<br /><span style={{ color: "var(--amber)" }}>Contact the event organiser to request a session reset.</span></>
          : <>You have used all {MAX_ATTEMPTS} attempts.<br /><span style={{ color: "var(--amber)" }}>Contact the event organiser to unlock a new session.</span></>}
      </div>
      <div style={{ background: "var(--s1)", border: "1px solid rgba(255,61,90,.3)", borderRadius: 6, padding: "14px 28px", fontSize: 12, fontFamily: "'Share Tech Mono',monospace", color: "var(--red)", letterSpacing: 2, marginBottom: 24 }}>
        {isTimeout ? "SESSION TIMED OUT · CONTACT ORGANISER" : "MAX ATTEMPTS REACHED · CONTACT ORGANISER"}
      </div>
      {attemptLog.length > 0 && (
        <div style={{ width: "100%", maxWidth: 600, textAlign: "left" }}>
          <ScorePanel attemptLog={attemptLog} />
        </div>
      )}
    </div>
  );
}

// ─── WIN SCREEN ────────────────────────────────────────────────────────────────
function WinScreen({ code, attemptLog }) {
  useEffect(() => {
    try { localStorage.setItem("final_vault_token", NEXT_TOKEN); } catch { }
    window.__finalVault__ = { token: NEXT_TOKEN, code, cleared: true };
    const final = calcFinalScore(attemptLog);
    console.clear();
    console.log("%c🏆 CODE CRACKER — CLEARED", "color:#b44fff;font-size:18px;font-weight:bold;");
    console.log(`%cFinal Score: ${final}/25`, "color:#ffb300;font-size:14px;");
    console.log(`%cPROCEED TO ROUND 2`, "color:#fff;background:#060c18;font-size:18px;font-weight:bold;padding:8px 20px;border-left:4px solid #b44fff;display:block;margin-top:6px;");
  }, []);

  const finalScore = calcFinalScore(attemptLog);
  const finalColor = finalScore >= 40 ? "var(--green)" : finalScore >= 25 ? "var(--amber)" : "var(--red)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", animation: "fadeUp .6s ease" }}>
      <div style={{ fontSize: 62, color: "var(--purple)", textShadow: "0 0 40px var(--purple)", animation: "spin 7s linear infinite", marginBottom: 16 }}>★</div>
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(20px,5vw,48px)", fontWeight: 900, color: "var(--purple)", letterSpacing: 6, marginBottom: 10, textShadow: "0 0 40px var(--purple)" }}>CODE CRACKED</div>
      <div style={{ fontSize: 13, color: "var(--text)", opacity: .75, letterSpacing: 1, maxWidth: 500, lineHeight: 2, marginBottom: 22 }}>
        Outstanding work. You decoded all 6 questions correctly and reconstructed the master code.
      </div>

      {/* Animated code tiles */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap", justifyContent: "center" }}>
        {code.split("").map((ch, i) => (
          <div key={i} style={{ width: 46, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(180,79,255,.1)", border: "1px solid var(--purple)", borderRadius: 5, fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: "var(--purple)", textShadow: "0 0 12px var(--purple)", animation: `codeChar .4s ease ${i * 70}ms both` }}>{ch}</div>
        ))}
      </div>

      {/* Final score highlight */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 22, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ background: "var(--s1)", border: "1px solid var(--amber)", borderRadius: 8, padding: "14px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: "var(--amber)", letterSpacing: 2, lineHeight: 1.5 }}>MARKS WILL BE</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: "var(--amber)", letterSpacing: 2 }}>ANNOUNCED SHORTLY</div>
        </div>
        <div style={{ background: "var(--s1)", border: "1px solid var(--purple)", borderRadius: 8, padding: "14px 24px", animation: "successGlow 2s ease infinite" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, color: "var(--purple)", letterSpacing: 3 }}>PHASE CLEARED</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 2, marginTop: 6 }}>PROCEED TO ROUND 2</div>
        </div>
      </div>

      {/* Full score panel */}
      <div style={{ width: "100%", maxWidth: 620, textAlign: "left", marginBottom: 14 }}>
        <ScorePanel attemptLog={attemptLog} />
      </div>
      <div style={{ fontSize: 11, fontFamily: "'Share Tech Mono',monospace", color: "var(--cyan)", letterSpacing: 2 }}>
        ▶ Score securely stored in Console &amp; localStorage
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Round1() {
  useEffect(() => { injectStyles(); }, []);

  const [sess, setSess] = useState(() => loadSess());
  const { phase, authed, attempts, timeLeft, chosen, timedOut, finalCode, attemptStart, attemptLog } = sess;

  const update = (patch, doSync = false) => {
    setSess(prev => {
      const next = { ...prev, ...patch };
      saveSess(next);
      if (doSync) syncToServer(next);
      return next;
    });
  };

  // ── Timer — ticks only during quiz ───────────────────────────────────────
  const timerRef = useRef(null);
  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => {
        setSess(prev => {
          if (prev.phase !== "quiz") { clearInterval(timerRef.current); return prev; }
          const t = prev.timeLeft - 1;
          if (t <= 0) {
            clearInterval(timerRef.current);
            // Build a timed-out attempt entry
            const timeUsed = TIME_LIMIT - 0; // used all time
            const correct = QUESTIONS.filter((q, i) => prev.chosen[i] !== null && prev.chosen[i] !== undefined && prev.chosen[i] === q.correct).length;
            const pct = Math.round((correct / QUESTIONS.length) * 100);
            const expCode = buildExpectedCode(prev.chosen);
            const score = calcAttemptScore(correct, TIME_LIMIT, "(timed out)", expCode);
            const entry = { attemptNo: prev.attempts + 1, correctCount: correct, pct, timeUsed: TIME_LIMIT, score, won: false, submittedCode: "(timed out)", expectedCode: expCode, ts: Date.now() };
            const next = { ...prev, timeLeft: 0, phase: "timed-out", timedOut: true, attemptLog: [...prev.attemptLog, entry] };
            saveSess(next);
            syncToServer(next);
            return next;
          }
          const next = { ...prev, timeLeft: t };
          saveSess(next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAuth = () => {
    if (attempts >= MAX_ATTEMPTS) { update({ phase: "locked" }, true); return; }
    update({ phase: "quiz", authed: true, attemptStart: Date.now() }, true);
  };

  const handleAnswer = (qIdx, optIdx) => {
    const newChosen = [...chosen]; newChosen[qIdx] = optIdx;
    update({ chosen: newChosen }, true);
  };

  const handleQuizFinish = (finalChosen, wasTimedOut) => {
    if (wasTimedOut) {
      update({ phase: "timed-out", chosen: finalChosen, timedOut: true }, true);
    } else {
      update({ phase: "code-entry", chosen: finalChosen }, true);
    }
  };

  // correct + pct passed up from CodeEntry after calculating
  const handleCodeSubmit = (correct, submittedCode, correctCount, pct) => {
    const timeUsed = attemptStart ? Math.round((Date.now() - attemptStart) / 1000) : TIME_LIMIT - timeLeft;
    const expectedCode = buildExpectedCode(chosen); // what code SHOULD be from their answers
    if (correct) {
      const score = calcAttemptScore(QUESTIONS.length, timeUsed, submittedCode, expectedCode);
      const entry = { attemptNo: attempts + 1, correctCount: QUESTIONS.length, pct: 100, timeUsed, score, won: true, submittedCode, expectedCode, ts: Date.now() };
      update({ phase: "win", finalCode: submittedCode, attempts: attempts + 1, attemptLog: [...attemptLog, entry] }, true);
    } else {
      const score = calcAttemptScore(correctCount || 0, timeUsed, submittedCode, expectedCode);
      const entry = { attemptNo: attempts + 1, correctCount: correctCount || 0, pct: pct || 0, timeUsed, score, won: false, submittedCode, expectedCode, ts: Date.now() };
      const newAttempts = attempts + 1;
      const nextPhase = newAttempts >= MAX_ATTEMPTS ? "locked" : "code-entry";
      update({ attempts: newAttempts, finalCode: submittedCode, phase: nextPhase, attemptLog: [...attemptLog, entry] }, true);
    }
  };

  const handleRestart = () => {
    if (attempts >= MAX_ATTEMPTS) { update({ phase: "locked" }, true); return; }
    // Keep timer running — only reset answers and record new attemptStart
    update({ phase: "quiz", chosen: Array(10).fill(null), attemptStart: Date.now() }, true);
  };

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <GridBg />

      {phase === "gate" && !authed && (
        <AccessGate attempts={attempts} attemptLog={attemptLog} onAuth={handleAuth} />
      )}

      {phase === "quiz" && (
        <QuizScreen
          timeLeft={timeLeft}
          chosen={chosen}
          onAnswer={handleAnswer}
          onFinish={handleQuizFinish}
        />
      )}

      {phase === "code-entry" && (
        <CodeEntry
          chosen={chosen}
          attemptsLeft={MAX_ATTEMPTS - attempts}
          timedOut={timedOut}
          attemptLog={attemptLog}
          currentAttemptNo={attempts + 1}
          onSubmit={handleCodeSubmit}
          onRestart={handleRestart}
        />
      )}

      {(phase === "locked" || phase === "timed-out") && (
        <EndScreen reason={phase} attemptLog={attemptLog} />
      )}

      {phase === "win" && <WinScreen code={finalCode} attemptLog={attemptLog} />}
    </div>
  );
}