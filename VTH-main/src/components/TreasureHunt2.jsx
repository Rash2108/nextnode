import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TILE = 40;
const COLS = 14;
const ROWS = 10;
const W = COLS * TILE;   // 560
const H = ROWS * TILE;   // 400
const SPEED = 4;             // pixels per frame — smooth walk

const T = { GRASS: 0, WALL: 1, PATH: 2, WATER: 3, TREE: 4, FLOWER: 5, DOOR: 6, LOCKED: 7, HINT: 8, NPC: 9 };

const ROOMS = [
  {
    id: 0, name: "PALLET TOWN", theme: "forest", accent: "#4caf50", npc: "🧙", npcName: "PROF. OAK",
    hint: "🍌 Index 0 = apple, index 1 = ?",
    puz: {
      title: "PYTHON LISTS", enemy: "PROF. OAK", enemyLv: 5,
      desc: "What does print(thislist[1]) output?",
      code: `thislist = ["apple", "banana", "cherry"]\nprint(thislist[1])`,
      link: "https://www.w3schools.com/python/python_lists_access.asp", ans: "banana"
    }
  },
  {
    id: 1, name: "CERULEAN CITY", theme: "water", accent: "#2196f3", npc: "🧜", npcName: "MISTY",
    hint: "📏 Count ALL characters — even spaces.",
    puz: {
      title: "JS STRINGS", enemy: "MISTY", enemyLv: 12,
      desc: "What does console.log(txt.length) output?",
      code: `let txt = "Hello World";\nconsole.log(txt.length);`,
      link: "https://www.w3schools.com/jsref/jsref_length_string.asp", ans: "11"
    }
  },
  {
    id: 2, name: "VERMILION CITY", theme: "desert", accent: "#ff9800", npc: "⚓", npcName: "LT. SURGE",
    hint: "🚗 dict[\"key\"] gives you the value for that key.",
    puz: {
      title: "PYTHON DICTS", enemy: "LT. SURGE", enemyLv: 21,
      desc: "What does print(car[\"brand\"]) output?",
      code: `car = {"brand":"Ford","model":"Mustang","year":1964}\nprint(car["brand"])`,
      link: "https://www.w3schools.com/python/python_dictionaries_access.asp", ans: "Ford"
    }
  },
  {
    id: 3, name: "LAVENDER TOWN", theme: "spooky", accent: "#9c27b0", npc: "👻", npcName: "CHANNELER",
    hint: "🔢 range(5) = 0,1,2,3,4 — add them all.",
    puz: {
      title: "FOR LOOPS", enemy: "CHANNELER", enemyLv: 30,
      desc: "What does print(count) output?",
      code: `count = 0\nfor i in range(5):\n    count += i\nprint(count)`,
      link: "https://www.w3schools.com/python/python_for_loops.asp", ans: "10"
    }
  },
  {
    id: 4, name: "FUCHSIA CITY", theme: "jungle", accent: "#e91e63", npc: "🎯", npcName: "KOGA",
    hint: "🍊 3 fruits + push(1) = length of ?",
    puz: {
      title: "JS ARRAYS", enemy: "KOGA", enemyLv: 43,
      desc: "What does console.log(fruits.length) output?",
      code: `const fruits = ["Banana","Orange","Apple"];\nfruits.push("Mango");\nconsole.log(fruits.length);`,
      link: "https://www.w3schools.com/jsref/jsref_push.asp", ans: "4"
    }
  },
  {
    id: 5, name: "INDIGO PLATEAU", theme: "volcano", accent: "#ffd700", npc: "🏆", npcName: "CHAMPION",
    hint: "🔬 type(42) includes angle brackets and quotes.",
    puz: {
      title: "PYTHON TYPE", enemy: "CHAMPION", enemyLv: 62,
      desc: "What does print(type(x)) output exactly?",
      code: `x = 42\nprint(type(x))`,
      link: "https://www.w3schools.com/python/ref_func_type.asp", ans: "<class 'int'>"
    }
  },
];

const FLAG = "FLAG{R3TR0_C0D3_HUNT_M4ST3R_2025}";
const SK = "poke_v4";
const loadS = () => { try { return JSON.parse(localStorage.getItem(SK)) || { room: 0, solved: [], hintRead: [], hasKey: false }; } catch { return { room: 0, solved: [], hintRead: [], hasKey: false }; } };
const saveS = s => localStorage.setItem(SK, JSON.stringify(s));

// ─────────────────────────────────────────────
// SEEDED RANDOM  (mulberry32)
// ─────────────────────────────────────────────
function makeRng(seed) {
  let s = seed | 0;
  return () => { s += 0x6d2b79f5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ─────────────────────────────────────────────
// MAP GENERATOR
// ─────────────────────────────────────────────
function generateMap(roomId, hintRead, solved, hasKey) {
  const rng = makeRng(roomId * 7919 + 1234);
  const ri = r => Math.floor(r * rng());

  // Fill grass
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS));

  // Border walls
  for (let c = 0; c < COLS; c++) { map[0][c] = T.WALL; map[ROWS - 1][c] = T.WALL; }
  for (let r = 0; r < ROWS; r++) { map[r][0] = T.WALL; map[r][COLS - 1] = T.WALL; }

  // Door / locked on right wall (row 4 or 5)
  const doorRow = 3 + ri(3);
  const puzzleDone = solved.includes(roomId);
  map[doorRow][COLS - 1] = puzzleDone ? T.DOOR : T.LOCKED;
  map[doorRow + 1][COLS - 1] = puzzleDone ? T.DOOR : T.LOCKED;

  // Scatter trees  (~18)
  for (let i = 0; i < 22; i++) {
    const r = 1 + ri(ROWS - 2), c = 1 + ri(COLS - 2);
    if (map[r][c] === T.GRASS && c < COLS - 3) map[r][c] = T.TREE;
  }

  // Scatter flowers (~12)
  for (let i = 0; i < 14; i++) {
    const r = 1 + ri(ROWS - 2), c = 1 + ri(COLS - 2);
    if (map[r][c] === T.GRASS && c < COLS - 3) map[r][c] = T.FLOWER;
  }

  // Water strip (varies per room)
  const themes = {
    water: [{ r: 2, c: 3, len: 4, dir: "h" }, { r: 6, c: 7, len: 3, dir: "h" }],
    forest: [{ r: 4, c: 5, len: 3, dir: "v" }],
    spooky: [{ r: 2, c: 8, len: 3, dir: "h" }, { r: 7, c: 2, len: 3, dir: "h" }],
    desert: [{ r: 5, c: 6, len: 2, dir: "v" }],
    jungle: [{ r: 3, c: 4, len: 4, dir: "h" }],
    volcano: [{ r: 6, c: 8, len: 3, dir: "h" }],
  };
  const theme = ROOMS[roomId].theme;
  (themes[theme] || []).forEach(({ r, c, len, dir }) => {
    for (let i = 0; i < len; i++) {
      const rr = r + (dir === "v" ? i : 0), cc = c + (dir === "h" ? i : 0);
      if (rr > 0 && rr < ROWS - 1 && cc > 0 && cc < COLS - 2) map[rr][cc] = T.WATER;
    }
  });

  // Path from left to right (2 segments)
  const pathR1 = 2 + ri(ROWS - 4);
  const pathR2 = 2 + ri(ROWS - 4);
  for (let c = 1; c < 7; c++)  if (map[pathR1][c] === T.GRASS || map[pathR1][c] === T.FLOWER) map[pathR1][c] = T.PATH;
  for (let c = 7; c < COLS - 2; c++) if (map[pathR2][c] === T.GRASS || map[pathR2][c] === T.FLOWER) map[pathR2][c] = T.PATH;

  // NPC position — somewhere in left half, on grass
  let npcR = 0, npcC = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = 1 + ri(ROWS - 2), c = 1 + ri(COLS / 2 - 1);
    if (map[r][c] === T.GRASS) { npcR = r; npcC = c; map[r][c] = T.NPC; break; }
  }

  // Hint object — random near interesting tile (tree/flower/water edge), right half
  let hintR = 0, hintC = 0;
  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++) for (let c = 4; c < COLS - 3; c++) {
    if (map[r][c] !== T.GRASS && map[r][c] !== T.PATH) continue;
    // adjacent to tree/flower/water?
    const adj = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    if (adj.some(([ar, ac]) => { const t = (map[ar] || [])[ac]; return t === T.TREE || t === T.FLOWER || t === T.WATER; }))
      candidates.push([r, c]);
  }
  if (candidates.length) {
    const pick = candidates[ri(candidates.length)];
    hintR = pick[0]; hintC = pick[1];
  } else {
    // fallback — any open grass right half
    for (let attempt = 0; attempt < 40; attempt++) {
      const r = 1 + ri(ROWS - 2), c = 5 + ri(COLS - 7);
      if (map[r][c] === T.GRASS) { hintR = r; hintC = c; break; }
    }
  }
  const hintDone = hintRead.includes(roomId);
  map[hintR][hintC] = hintDone ? T.FLOWER : T.HINT;

  return { map, doorRow, npcR, npcC, hintR, hintC };
}

// ─────────────────────────────────────────────
// SPAWN — random, away from door (right wall)
// ─────────────────────────────────────────────
function randomSpawn(map, doorRow, roomId) {
  const rng = makeRng(roomId * 3571 + Date.now() % 1000);
  const ri = r => Math.floor(r * rng());
  const passable = [T.GRASS, T.PATH, T.FLOWER];
  for (let attempt = 0; attempt < 80; attempt++) {
    const r = 1 + ri(ROWS - 2), c = 1 + ri(COLS / 2); // left half only
    if (passable.includes(map[r]?.[c])) return { x: c, y: r };
  }
  return { x: 2, y: 2 };
}

// ─────────────────────────────────────────────
// TILE DRAWING
// ─────────────────────────────────────────────
const THEMES = {
  forest: { grass: "#5aaa3c", grassB: "#4a8a2c", path: "#c8a040", wall: "#4a3010", water: "#3888c8" },
  water: { grass: "#48b04a", grassB: "#38903a", path: "#d0aa48", wall: "#304870", water: "#2878e0" },
  desert: { grass: "#c8b060", grassB: "#a89040", path: "#e0c870", wall: "#806830", water: "#4090c8" },
  spooky: { grass: "#607060", grassB: "#485848", path: "#908878", wall: "#302830", water: "#284060" },
  jungle: { grass: "#38a030", grassB: "#288020", path: "#b09838", wall: "#284018", water: "#2090a0" },
  volcano: { grass: "#806040", grassB: "#604820", path: "#d0a840", wall: "#483020", water: "#e04020" },
};

function drawTile(ctx, type, px, py, theme, frame) {
  const th = THEMES[theme] || THEMES.forest;
  const s = TILE;
  switch (type) {
    case T.GRASS:
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = th.grassB; ctx.fillRect(px, py, 2, 2); ctx.fillRect(px + s - 2, py + s - 2, 2, 2);
      break;
    case T.WALL:
      ctx.fillStyle = th.wall; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(px, py, s, 3); ctx.fillRect(px, py, 3, s);
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(px + 1, py + 1, s - 2, 2);
      break;
    case T.PATH:
      ctx.fillStyle = th.path; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = "rgba(0,0,0,.1)";
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 3 + i * 12 + ((py / s | 0) % 2) * 6, py + s * .3, 3, 3);
      break;
    case T.WATER: {
      ctx.fillStyle = th.water; ctx.fillRect(px, py, s, s);
      const ripple = Math.sin(frame * .07 + px * .05 + py * .03) * 4;
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillRect(px + 4 + ripple, py + s * .25, s - 14, 3);
      ctx.fillRect(px + 8 - ripple, py + s * .6, s - 18, 3);
      ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(px, py, s, s * .4);
      break;
    }
    case T.TREE:
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = "#5a3010"; ctx.fillRect(px + s * .38, py + s * .55, s * .24, s * .45);
      ctx.fillStyle = "#1a5a18"; ctx.beginPath(); ctx.arc(px + s / 2, py + s * .38, s * .34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#287028"; ctx.beginPath(); ctx.arc(px + s * .38, py + s * .32, s * .22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3a8830"; ctx.beginPath(); ctx.arc(px + s * .62, py + s * .3, s * .18, 0, Math.PI * 2); ctx.fill();
      break;
    case T.FLOWER:
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = "#2a9020"; ctx.fillRect(px + s * .45, py + s * .55, 3, s * .4);
      [[-6, -6], [6, -6], [0, -12], [-8, 0], [8, 0]].forEach(([dx, dy]) => {
        ctx.fillStyle = ["#f060a0", "#ff88c0", "#e04080", "#ff44aa", "#cc3388"][[dx, dy].toString().length % 5];
        ctx.beginPath(); ctx.arc(px + s / 2 + dx, py + s * .55 + dy, 4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "#f8e020"; ctx.beginPath(); ctx.arc(px + s / 2, py + s * .55, 4, 0, Math.PI * 2); ctx.fill();
      break;
    case T.HINT: {
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
      const glow = .5 + Math.sin(frame * .12) * .4;
      ctx.fillStyle = `rgba(255,220,80,${glow * .35})`; ctx.fillRect(px - 2, py - 2, s + 4, s + 4);
      // chest body
      ctx.fillStyle = "#c8901c"; ctx.fillRect(px + 6, py + s * .45, s - 12, s * .45);
      ctx.fillStyle = "#e0a828"; ctx.fillRect(px + 6, py + s * .45, s - 12, s * .2);
      ctx.fillStyle = "#f0c030"; ctx.fillRect(px + s * .38, py + s * .52, s * .24, s * .18);
      // glow top
      ctx.fillStyle = `rgba(255,240,100,${glow * .6})`; ctx.fillRect(px + s * .38, py + s * .52, s * .24, s * .18);
      break;
    }
    case T.NPC:
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
      ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(px + s / 2, py + s - .5 * 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d06028"; ctx.fillRect(px + s * .3, py + s * .42, s * .4, s * .38);
      ctx.fillStyle = "#f0c080"; ctx.beginPath(); ctx.arc(px + s / 2, py + s * .34, s * .2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#802010"; ctx.fillRect(px + s * .24, py + s * .18, s * .52, s * .2);
      ctx.fillRect(px + s * .2, py + s * .15, s * .6, s * .1);
      ctx.fillStyle = "#202020"; ctx.fillRect(px + s * .36, py + s * .3, 4, 3); ctx.fillRect(px + s * .54, py + s * .3, 4, 3);
      break;
    case T.DOOR: {
      ctx.fillStyle = "#203060"; ctx.fillRect(px, py, s, s);
      const dg = .5 + Math.sin(frame * .14) * .4;
      ctx.fillStyle = `rgba(255,200,0,${dg * .5})`; ctx.fillRect(px + 3, py + 3, s - 6, s - 6);
      ctx.fillStyle = "#e0b820"; ctx.fillRect(px + 6, py + 6, s - 12, s - 12);
      ctx.fillStyle = "#f8d040"; ctx.fillRect(px + 10, py + 10, s - 20, s - 20);
      ctx.fillStyle = "#fff"; ctx.font = `${s * .5}px serif`; ctx.textAlign = "center";
      ctx.fillText("🚪", px + s / 2, py + s * .72);
      break;
    }
    case T.LOCKED:
      ctx.fillStyle = "#3a1010"; ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = "#c04020"; ctx.lineWidth = 2; ctx.strokeRect(px + 3, py + 3, s - 6, s - 6);
      ctx.fillStyle = "#c04020"; ctx.font = `${s * .5}px serif`; ctx.textAlign = "center";
      ctx.fillText("🔒", px + s / 2, py + s * .72);
      break;
    default:
      ctx.fillStyle = th.grass; ctx.fillRect(px, py, s, s);
  }
  ctx.textAlign = "left";
}

// ─────────────────────────────────────────────
// PLAYER DRAW  (pixel coords, not tile)
// ─────────────────────────────────────────────
function drawPlayer(ctx, px, py, dir, walkFrame) {
  const s = TILE;
  const x = Math.round(px - s / 2);
  const y = Math.round(py - s * .75);
  const wb = Math.sin(walkFrame * .25) * 3;   // walk bob

  // shadow
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(px, py, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  // shoes
  ctx.fillStyle = "#1a1a1a";
  const sl = walkFrame > .0 ? Math.sin(walkFrame * .25) * 3 : 0;
  ctx.fillRect(x + 7, y + s - 9, 8, 7);
  ctx.fillRect(x + s - 17, y + s - 9 - sl, 8, 7);
  // pants
  ctx.fillStyle = "#3050c0"; ctx.fillRect(x + 8, y + s * .52, s * .5, s * .28);
  // shirt
  ctx.fillStyle = "#d02020"; ctx.fillRect(x + 7, y + s * .32, s * .52, s * .24);
  // arms
  ctx.fillStyle = "#d02020";
  const as = Math.sin(walkFrame * .25) * 5;
  ctx.fillRect(x + 2, y + s * .33 + as, 6, s * .2);
  ctx.fillRect(x + s - 9, y + s * .33 - as, 6, s * .2);
  // head
  ctx.fillStyle = "#f0c080"; ctx.beginPath(); ctx.arc(px, y + s * .22 + wb * .5, s * .22, 0, Math.PI * 2); ctx.fill();
  // hair
  ctx.fillStyle = "#c05020"; ctx.fillRect(x + 8, y + s * .02, s * .52, s * .15);
  ctx.beginPath(); ctx.arc(px, y + s * .08, s * .22, Math.PI, 0); ctx.fill();
  // cap
  ctx.fillStyle = "#d02020"; ctx.fillRect(x + 6, y, s * .54, s * .14);
  ctx.fillRect(x + 4, y, s * .58, s * .08);
  ctx.fillStyle = "#b01818"; ctx.fillRect(x + 2, y + s * .06, s * .22, s * .08);
  // eyes
  ctx.fillStyle = "#1a1a1a";
  if (dir === 0) { ctx.fillRect(px - 5, y + s * .18, 3, 3); ctx.fillRect(px + 2, y + s * .18, 3, 3); }
  else if (dir === 1) { ctx.fillRect(px - 5, y + s * .22, 3, 3); ctx.fillRect(px + 2, y + s * .22, 3, 3); }
  else if (dir === 2) { ctx.fillRect(px - 6, y + s * .2, 3, 3); ctx.fillRect(px + 1, y + s * .2, 3, 3); }
  else { ctx.fillRect(px - 4, y + s * .2, 3, 3); ctx.fillRect(px + 3, y + s * .2, 3, 3); }
}

// ─────────────────────────────────────────────
// DIALOG BOX — Z/Enter advances, no click needed
// ─────────────────────────────────────────────
function DialogBox({ lines, onDone, accent }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [typing, setTyping] = useState(true);
  const advRef = useRef();
  const cur = lines[idx] || "";

  useEffect(() => {
    setShown(""); setTyping(true);
    let i = 0;
    const iv = setInterval(() => { i++; setShown(cur.slice(0, i)); if (i >= cur.length) { setTyping(false); clearInterval(iv); } }, 32);
    return () => clearInterval(iv);
  }, [idx]);

  function advance() {
    if (typing) { setShown(cur); setTyping(false); return; }
    if (idx < lines.length - 1) setIdx(i => i + 1);
    else onDone();
  }
  advRef.current = advance;

  useEffect(() => {
    const kd = e => {
      if (["z", "Z", "Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); advRef.current(); }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  return (
    <div onClick={advance} style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "#f0ead8", border: `3px solid ${accent || "#888"}`,
      borderBottom: "none", padding: "12px 16px 10px", cursor: "pointer",
      fontFamily: "'VT323',monospace", zIndex: 200, userSelect: "none"
    }}>
      <div style={{ position: "absolute", top: 8, right: 12, fontSize: 11, color: "#aaa" }}>Z / ↵</div>
      <div style={{ fontSize: 22, lineHeight: 1.5, color: "#101010", minHeight: 56, letterSpacing: .5 }}>
        {shown}{!typing && <span style={{ animation: "blink 1s infinite", opacity: 1 }}>▶</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BATTLE SCREEN — full Pokémon-style
// ─────────────────────────────────────────────
function BattleScreen({ room, onSolve, onClose }) {
  const p = room.puz;
  // phases: slideIn → intro → menu → fight → win → lose(unused)
  const [phase, setPhase] = useState("slideIn");
  const [dIdx, setDIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [typing, setTyping] = useState(true);
  const [menuSel, setMenuSel] = useState(0);  // 0=FIGHT 1=BAG 2=RUN 3=POKé
  const [val, setVal] = useState("");
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);
  const [enemyHp, setEnemyHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [showCode, setShowCode] = useState(false);
  const inp = useRef();
  const advRef = useRef();
  const lv = p.enemyLv;

  // Slide-in animation then start intro
  useEffect(() => {
    const t = setTimeout(() => setPhase("intro"), 600);
    return () => clearTimeout(t);
  }, []);

  const introLines = [
    `${p.enemy} (Lv.${lv}) wants to battle!`,
    `${p.enemy}: Solve my coding challenge to pass!`,
    `Use FIGHT to open the puzzle terminal.`,
  ];
  const winLines = [
    `${p.enemy} was defeated!`,
    `You received the ROOM KEY! 🗝️`,
    `Press Z to continue...`,
  ];
  const curLine = phase === "intro" ? (introLines[dIdx] || "") : phase === "win" ? (winLines[dIdx] || "") : "";

  useEffect(() => {
    if (phase !== "intro" && phase !== "win") return;
    setShown(""); setTyping(true);
    let i = 0;
    const iv = setInterval(() => { i++; setShown(curLine.slice(0, i)); if (i >= curLine.length) { setTyping(false); clearInterval(iv); } }, 34);
    return () => clearInterval(iv);
  }, [dIdx, phase]);

  function advDialog() {
    if (typing) { setShown(curLine); setTyping(false); return; }
    if (phase === "intro") {
      if (dIdx < introLines.length - 1) setDIdx(d => d + 1);
      else setPhase("menu");
    } else if (phase === "win") {
      if (dIdx < winLines.length - 1) setDIdx(d => d + 1);
      else onClose();
    }
  }
  advRef.current = advDialog;

  function doFight() { setPhase("fight"); setShowCode(false); setTimeout(() => inp.current?.focus(), 150); }
  function doRun() { onClose(); }

  function submitAnswer() {
    const v = val.trim();
    if (v.toLowerCase() === p.ans.toLowerCase()) {
      // animate HP drain
      setEnemyHp(0);
      onSolve();
      setTimeout(() => { setPhase("win"); setDIdx(0); }, 800);
    } else {
      setTries(t => t + 1);
      setShake(true); setTimeout(() => setShake(false), 500);
      setPlayerHp(h => Math.max(0, h - 15));
      setVal("");
      setTimeout(() => inp.current?.focus(), 100);
    }
  }

  // keyboard
  useEffect(() => {
    function kd(e) {
      if (phase === "intro" || phase === "win") {
        if (["z", "Z", "Enter", " "].includes(e.key)) { e.preventDefault(); advRef.current(); }
      } else if (phase === "menu") {
        const keys4 = [["w", "W", "ArrowUp"], ["s", "S", "ArrowDown"], ["a", "A", "ArrowLeft"], ["d", "D", "ArrowRight"]];
        const [up, dn, lt, rt] = keys4;
        if (up.includes(e.key) || lt.includes(e.key)) setMenuSel(s => (s - 1 + 4) % 4);
        else if (dn.includes(e.key) || rt.includes(e.key)) setMenuSel(s => (s + 1) % 4);
        else if (["z", "Z", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          setMenuSel(cur => { if (cur === 0) doFight(); else if (cur === 2) doRun(); return cur; });
        }
      } else if (phase === "fight") {
        if (e.key === "Escape") setPhase("menu");
      }
    }
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [phase]);

  const slideStyle = phase === "slideIn"
    ? { transform: "translateX(100%)", transition: "none" }
    : { transform: "translateX(0)", transition: "transform .5s cubic-bezier(.2,.8,.4,1)" };

  const MENU = [
    { label: "FIGHT", icon: "⚔️", color: "#e03030", desc: "Open the code challenge" },
    { label: "BAG", icon: "🎒", color: "#4080e0", desc: "No items available" },
    { label: "RUN", icon: "💨", color: "#808080", desc: "Flee from battle" },
    { label: "POKéMON", icon: "🔵", color: "#20a060", desc: "No Pokémon available" },
  ];

  const hpColor = h => h > 50 ? "#40d040" : h > 25 ? "#d0d020" : "#e02020";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000, background: "#101820", display: "flex",
      flexDirection: "column", fontFamily: "'VT323',monospace", ...slideStyle
    }}>

      {/* ── ARENA ────────────────────── */}
      <div style={{
        flex: "0 0 54%", position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg,#5060b0 0%,#8098e8 42%,#70b840 42%,#48882a 100%)"
      }}>

        {/* animated bg clouds */}
        {[20, 45, 70].map((left, i) => (
          <div key={i} style={{
            position: "absolute", top: `${8 + i * 8}%`, left: `${(left + Date.now() / 8000 * 10) % 110 - 10}%`,
            width: 80 + i * 20, height: 22, borderRadius: 20, background: "rgba(255,255,255,.18)", pointerEvents: "none"
          }} />
        ))}

        {/* ENEMY side — top right */}
        <div style={{ position: "absolute", right: 24, top: 18, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {/* stat card */}
          <div style={{ background: "#f0e8d0", border: "2px solid #6a6050", padding: "6px 12px", minWidth: 200, boxShadow: "2px 2px 0 #0004" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 18, letterSpacing: 1, color: "#101010", fontWeight: "bold" }}>{p.enemy}</span>
              <span style={{ fontSize: 13, color: "#606060" }}>Lv.{lv}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: "bold", color: "#204020", minWidth: 20 }}>HP</span>
              <div style={{ flex: 1, height: 10, background: "#606060", border: "1px solid #404040", borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2, width: `${enemyHp}%`,
                  background: hpColor(enemyHp), transition: "width .6s ease", boxShadow: "0 0 4px currentColor"
                }} />
              </div>
            </div>
          </div>
          {/* enemy sprite */}
          <div style={{
            fontSize: 88, lineHeight: 1,
            filter: `drop-shadow(3px 3px 0 #0008) ${phase === "win" ? "grayscale(1) opacity(.4)" : ""}`,
            transition: "filter .5s",
            transform: shake ? "translateX(8px)" : "translateX(0)", transition2: "transform .1s"
          }}>
            {room.npc}
          </div>
        </div>

        {/* PLAYER side — bottom left */}
        <div style={{
          position: "absolute", left: 20, bottom: 20, display: "flex", flexDirection: "row",
          alignItems: "flex-end", gap: 14
        }}>
          {/* back-view trainer */}
          <div style={{ fontSize: 80, lineHeight: 1, transform: "scaleX(-1)", filter: "drop-shadow(3px 3px 0 #0008)" }}>🧒</div>
          {/* stat card */}
          <div style={{ background: "#f0e8d0", border: "2px solid #6a6050", padding: "6px 12px", minWidth: 200, boxShadow: "2px 2px 0 #0004" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 18, letterSpacing: 1, color: "#101010", fontWeight: "bold" }}>CODER</span>
              <span style={{ fontSize: 13, color: "#606060" }}>Lv.50</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: "bold", color: "#204020", minWidth: 20 }}>HP</span>
              <div style={{ flex: 1, height: 10, background: "#606060", border: "1px solid #404040", borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2, width: `${playerHp}%`,
                  background: hpColor(playerHp), transition: "width .4s ease"
                }} />
              </div>
              <span style={{ fontSize: 12, color: "#404040", minWidth: 56, textAlign: "right" }}>{playerHp}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL ─────────────── */}
      <div style={{ flex: "0 0 46%", display: "flex", flexDirection: "column", background: "#f0e8d0", borderTop: "4px solid #8a8070" }}>

        {/* dialog / fight area */}
        <div style={{ flex: 1, padding: "10px 14px", overflow: "auto", cursor: ["intro", "win"].includes(phase) ? "pointer" : "default" }}
          onClick={() => ["intro", "win"].includes(phase) && advRef.current()}>

          {(phase === "intro" || phase === "win") && (
            <div style={{ fontSize: 22, lineHeight: 1.6, color: "#101010", letterSpacing: .5 }}>
              {shown}{!typing && <span style={{ animation: "blink 1s infinite" }}>▶</span>}
            </div>
          )}
          {phase === "menu" && (
            <div style={{ fontSize: 22, color: "#101010" }}>What will CODER do?</div>
          )}
          {phase === "fight" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #c0b898", paddingBottom: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 20, letterSpacing: 1, color: "#101010" }}>⚔ {p.title}</span>
                <a href={p.link} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: "#1040a0", textDecoration: "none", borderBottom: "1px dashed #1040a0" }}>
                  📖 Docs
                </a>
              </div>
              <div style={{ fontSize: 14, color: "#303030", lineHeight: 1.5 }}>{p.desc}</div>
              <button onClick={() => setShowCode(v => !v)}
                style={{
                  alignSelf: "flex-start", background: "#303030", color: "#50e870", border: "none",
                  fontFamily: "'VT323',monospace", fontSize: 15, padding: "3px 12px", cursor: "pointer", letterSpacing: 1
                }}>
                {showCode ? "▼ HIDE CODE" : "▶ SHOW CODE"}
              </button>
              {showCode && <pre style={{
                background: "#101010", color: "#50e870", padding: "8px 10px",
                fontSize: 12, overflowX: "auto", whiteSpace: "pre", lineHeight: 1.6,
                border: "2px solid #303030", margin: 0, flexShrink: 0
              }}>{p.code}</pre>}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: "auto", flexShrink: 0 }}>
                <input ref={inp} value={val} onChange={e => setVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submitAnswer(); if (e.key === "Escape") setPhase("menu"); }}
                  placeholder={tries > 0 ? `Attempt ${tries + 1} — try again...` : "Type exact output…"}
                  style={{
                    flex: 1, background: "#fff", border: `2px solid ${tries > 0 ? "#e04040" : "#8a8070"}`,
                    color: "#101010", fontFamily: "'VT323',monospace", fontSize: 18, padding: "5px 10px", outline: "none"
                  }}
                  autoComplete="off" spellCheck={false} />
                <button onClick={submitAnswer}
                  style={{
                    background: "#e03030", border: "2px solid #901818", color: "#fff",
                    fontFamily: "'VT323',monospace", fontSize: 20, padding: "5px 18px", cursor: "pointer", letterSpacing: 1
                  }}>
                  USE
                </button>
              </div>
              {tries > 0 && <div style={{ fontSize: 14, color: "#a01010", letterSpacing: .5 }}>
                ✘ Wrong! {tries} failed attempt{tries > 1 ? "s" : ""}. Check the code carefully.
              </div>}
              <div style={{ fontSize: 12, color: "#808060", letterSpacing: .5 }}>ESC to go back to menu</div>
            </div>
          )}
          {phase === "slideIn" && <div style={{ fontSize: 20, color: "#888" }}>Entering battle...</div>}
        </div>

        {/* MENU — only in menu phase */}
        {phase === "menu" && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3,
            padding: "6px 8px", background: "#e0d8c0", borderTop: "3px solid #8a8070", flexShrink: 0
          }}>
            {MENU.map((m, i) => (
              <div key={m.label} onClick={() => { setMenuSel(i); if (i === 0) doFight(); else if (i === 2) doRun(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  background: menuSel === i ? m.color : "#f0e8d0",
                  color: menuSel === i ? "#fff" : "#202020",
                  border: menuSel === i ? "2px solid rgba(0,0,0,.4)" : "2px solid #a09880",
                  cursor: "pointer", transition: "all .1s", userSelect: "none",
                  fontSize: 20, letterSpacing: 1
                }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                {menuSel === i && <span>▶</span>}
                {m.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME CANVAS — sub-pixel smooth movement
// ─────────────────────────────────────────────
function GameCanvas({ state, onInteract, dialogLines, onDialogDone, showBattle, onBattleSolve, onBattleClose }) {
  const canvasRef = useRef();
  const frameRef = useRef(0);

  // Sub-pixel position (center of player in pixels)
  const pos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const [tilePos, setTilePos] = useState({ x: 0, y: 0 }); // for interaction checking

  // Build map for current room
  const roomIdx = Math.min(state.room, ROOMS.length - 1);
  const mapData = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Room change → rebuild map AND reset player position to random spawn
  useEffect(() => {
    const s = stateRef.current;
    const { map, doorRow, npcR, npcC, hintR, hintC } =
      generateMap(roomIdx, s.hintRead, s.solved, s.hasKey);
    const spawn = randomSpawn(map, doorRow, roomIdx);
    mapData.current = { map, doorRow, npcR, npcC, hintR, hintC };
    pos.current = { x: (spawn.x + .5) * TILE, y: (spawn.y + .75) * TILE };
    targetPos.current = { ...pos.current };
    setTilePos(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdx]); // ONLY on room change — not on hintRead/solved/hasKey

  // hint read or puzzle solved mid-room → refresh map tiles only, NO position reset
  useEffect(() => {
    if (!mapData.current) return;
    const s = stateRef.current;
    const refreshed = generateMap(roomIdx, s.hintRead, s.solved, s.hasKey);
    // keep existing doorRow/npcR/npcC/hintR/hintC so labels don't jump
    mapData.current = { ...mapData.current, map: refreshed.map };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hintRead.length, state.solved.length, state.hasKey]);

  // Direction & walk frame
  const dir = useRef(1); // 0=up 1=down 2=left 3=right
  const walkFrame = useRef(0);
  const moving = useRef(false);

  // Keys held
  const keys = useRef({});
  const live = useRef({});
  live.current = { state, onInteract, dialogLines, showBattle };

  // Key listeners
  useEffect(() => {
    const kd = e => { keys.current[e.key] = true; };
    const ku = e => { keys.current[e.key] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // Interact on keydown (Z/E/Space) — uses live ref
  useEffect(() => {
    const kd = e => {
      const { dialogLines, showBattle, onInteract } = live.current;
      if (dialogLines || showBattle) return;
      if (["z", "Z", "e", "E", " "].includes(e.key)) {
        e.preventDefault();
        doInteract(onInteract);
      }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  function doInteract(onInteract) {
    const md = mapData.current; if (!md) return;
    const px = Math.round(pos.current.x / TILE - .5);
    const py = Math.round(pos.current.y / TILE - .75);
    const d = dir.current;
    const DD = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const [fx, fy] = DD[d];
    // check faced tile first, then all adjacent
    const checks = [{ x: px + fx, y: py + fy }, { x: px, y: py - 1 }, { x: px, y: py + 1 }, { x: px - 1, y: py }, { x: px + 1, y: py }];
    for (const { x: nx, y: ny } of checks) {
      if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
      const t = md.map[ny]?.[nx];
      if (t === T.NPC) { onInteract("npc"); return; }
      if (t === T.HINT) { onInteract("scroll"); return; }
      if (t === T.DOOR) { onInteract("door"); return; }
      if (t === T.LOCKED) { onInteract("locked"); return; }
    }
  }

  // ── MAIN GAME LOOP ──
  useEffect(() => {
    let raf;
    const PASSABLE = [T.GRASS, T.PATH, T.FLOWER, T.DOOR];

    function loop() {
      raf = requestAnimationFrame(loop);
      frameRef.current++;
      const { dialogLines, showBattle } = live.current;
      const md = mapData.current; if (!md) return;
      const f = frameRef.current;

      // ── MOVEMENT ──
      if (!dialogLines && !showBattle) {
        let vx = 0, vy = 0;
        const K = keys.current;
        if (K.ArrowUp || K.w || K.W) { vy = -SPEED; dir.current = 0; }
        else if (K.ArrowDown || K.s || K.S) { vy = SPEED; dir.current = 1; }
        else if (K.ArrowLeft || K.a || K.A) { vx = -SPEED; dir.current = 2; }
        else if (K.ArrowRight || K.d || K.D) { vx = SPEED; dir.current = 3; }

        if (vx || vy) {
          moving.current = true;
          walkFrame.current = f;
          // Try moving
          const nx = pos.current.x + vx;
          const ny = pos.current.y + vy;
          const tileX = Math.round(nx / TILE - .5) | 0;
          const tileY = Math.round(ny / TILE - .75) | 0;
          if (tileX >= 0 && tileX < COLS && tileY >= 0 && tileY < ROWS) {
            const t = md.map[tileY]?.[tileX];
            if (PASSABLE.includes(t)) {
              pos.current.x = nx; pos.current.y = ny;
              // Update tile position for interaction
              const ntx = Math.round(pos.current.x / TILE - .5) | 0;
              const nty = Math.round(pos.current.y / TILE - .75) | 0;
              setTilePos(p => p.x === ntx && p.y === nty ? p : { x: ntx, y: nty });
            }
          }
          // Wall on X? try Y only
          else {
            const ny2 = pos.current.y + vy;
            const tileY2 = Math.round(ny2 / TILE - .75) | 0;
            const tileX0 = Math.round(pos.current.x / TILE - .5) | 0;
            if (tileY2 >= 0 && tileY2 < ROWS && tileX0 >= 0 && tileX0 < COLS) {
              const t = md.map[tileY2]?.[tileX0];
              if (PASSABLE.includes(t)) pos.current.y = ny2;
            }
            const nx2 = pos.current.x + vx;
            const tileX2 = Math.round(nx2 / TILE - .5) | 0;
            const tileY0 = Math.round(pos.current.y / TILE - .75) | 0;
            if (tileX2 >= 0 && tileX2 < COLS && tileY0 >= 0 && tileY0 < ROWS) {
              const t = md.map[tileY0]?.[tileX2];
              if (PASSABLE.includes(t)) pos.current.x = nx2;
            }
          }
          // clamp to bounds
          pos.current.x = Math.max(TILE * .6, Math.min(W - TILE * .6, pos.current.x));
          pos.current.y = Math.max(TILE * .8, Math.min(H - TILE * .3, pos.current.y));
        } else {
          moving.current = false;
        }
      }

      // ── RENDER ──
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      const theme = ROOMS[roomIdx].theme;

      for (let r = 0; r < ROWS; r++)
        for (let cl = 0; cl < COLS; cl++)
          drawTile(ctx, (md.map[r] || [])[cl] ?? T.GRASS, cl * TILE, r * TILE, theme, f);

      // door label
      if (state.solved.includes(roomIdx)) {
        ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(W - TILE - 1, md.doorRow * TILE - 18, TILE + 2, 18);
        ctx.fillStyle = "#f8d040"; ctx.font = "11px 'VT323',monospace"; ctx.textAlign = "center";
        ctx.fillText("[Z] ENTER", W - TILE / 2, md.doorRow * TILE - 5);
      }
      // hint glint label
      if (!state.hintRead.includes(roomIdx)) {
        ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(md.hintC * TILE, md.hintR * TILE - 18, TILE, 18);
        ctx.fillStyle = "#f8e040"; ctx.font = "11px 'VT323',monospace"; ctx.textAlign = "center";
        ctx.fillText("[Z] HINT", md.hintC * TILE + TILE / 2, md.hintR * TILE - 5);
      }
      ctx.textAlign = "left";

      drawPlayer(ctx, pos.current.x, pos.current.y, dir.current, moving.current ? f : 0);

      // HUD bar
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = "#f0e8d0"; ctx.font = "bold 13px 'VT323',monospace";
      ctx.fillText(`${ROOMS[roomIdx].music} ${ROOMS[roomIdx].name}  ·  ROOM ${roomIdx + 1}/${ROOMS.length}`, 8, 15);
      if (state.hasKey) {
        ctx.fillStyle = "#ffd700"; ctx.fillText("🗝️ KEY OBTAINED", W - 140, 15);
      }
      // controls
      ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, H - 18, W, 18);
      ctx.fillStyle = "#b0c8a0"; ctx.font = "11px 'VT323',monospace";
      ctx.fillText("WASD/ARROWS: MOVE    Z/E: INTERACT", 8, H - 5);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [roomIdx, state]);

  const room = ROOMS[roomIdx];

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <canvas ref={canvasRef} width={W} height={H}
        style={{ display: "block", imageRendering: "pixelated", imageRendering: "-moz-crisp-edges" }} />
      {dialogLines && <DialogBox lines={dialogLines} onDone={onDialogDone} accent={room.accent} />}
      {showBattle && <BattleScreen room={room} onSolve={onBattleSolve} onClose={onBattleClose} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// GBA SHELL
// ─────────────────────────────────────────────
function GBAShell({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#111824", padding: 16
    }}>
      <div style={{
        background: "linear-gradient(145deg,#a0a0b0,#808090)",
        borderRadius: "20px 20px 36px 36px", padding: "14px 18px 22px",
        boxShadow: "0 10px 40px #0009,inset 0 1px 0 #c0c0d0,inset 0 -2px 6px #0005",
        width: W + 36, flexShrink: 0
      }}>
        {/* top */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 6px" }}>
          <div style={{ display: "flex", gap: 3 }}>{[...Array(8)].map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#555", boxShadow: "inset 0 1px 1px #333" }} />)}</div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", fontFamily: "Arial,sans-serif", fontWeight: "bold" }}>GAME BOY ADVANCE</div>
          <div style={{ display: "flex", gap: 3 }}>{[...Array(8)].map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#555", boxShadow: "inset 0 1px 1px #333" }} />)}</div>
        </div>
        {/* screen */}
        <div style={{ background: "#1a1a28", borderRadius: 6, padding: 8, boxShadow: "inset 0 4px 12px #0008", marginBottom: 10 }}>
          <div style={{ background: "#080810", borderRadius: 3, padding: 3, boxShadow: "inset 0 2px 5px #000a", lineHeight: 0 }}>
            {children}
          </div>
        </div>
        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px" }}>
          {/* d-pad */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,26px)", gridTemplateRows: "repeat(3,26px)", gap: 1 }}>
            {[null, "▲", null, "◀", null, "▶", null, "▼", null].map((l, i) => (
              <div key={i} style={{
                background: l ? "#3a3a3a" : "transparent", color: "#aaa",
                fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: l === "▲" || l === "▼" ? "3px 3px 0 0" : "2px", cursor: l ? "pointer" : "default"
              }}>{l}</div>
            ))}
          </div>
          {/* start/select */}
          <div style={{ display: "flex", gap: 10 }}>
            {["SELECT", "START"].map(l => (
              <div key={l} style={{
                background: "#505060", color: "#909090", fontSize: 9, padding: "4px 8px",
                borderRadius: 10, letterSpacing: 1, fontFamily: "Arial,sans-serif",
                boxShadow: "0 2px 0 #303038", cursor: "pointer"
              }}>{l}</div>
            ))}
          </div>
          {/* A/B */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {[{ l: "B", c: "#2050d0" }, { l: "A", c: "#d02020" }].map(({ l, c }) => (
              <div key={l} style={{
                width: 34, height: 34, borderRadius: "50%", background: c,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: "bold", fontSize: 14, fontFamily: "Arial,sans-serif",
                boxShadow: `0 3px 0 rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.2)`, cursor: "pointer"
              }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <div style={{ width: 70, height: 5, background: "#404040", borderRadius: 3, boxShadow: "inset 0 2px 3px #0006" }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VAULT / WIN SCREEN
// ─────────────────────────────────────────────
function VaultScreen({ onRestart }) {
  const [tick, setTick] = useState(0);
  const parts = useRef(Array.from({ length: 120 }, (_, i) => ({
    x: 40 + Math.random() * 20, y: 40 + Math.random() * 20,
    vx: (Math.random() - .5) * .6, vy: -Math.random() * .5 - .1,
    r: Math.random() * 8 + 3,
    c: ["#ffd700", "#ff4444", "#00ff88", "#00cfff", "#ff88ff", "#fff", "#ff8800"][i % 7],
    life: Math.random(),
  })));

  useEffect(() => {
    localStorage.setItem("rch_flag", FLAG);
    console.log("%c🏆 CODE HUNT COMPLETE!", "color:#ffd700;font-size:22px;font-weight:bold");
    console.log("%c" + FLAG, "color:#ffd700;font-size:16px;font-family:monospace");
    const iv = setInterval(() => setTick(t => t + 1), 16);
    return () => clearInterval(iv);
  }, []);

  parts.current.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .015; p.life -= .0025;
    if (p.life <= 0) { p.x = 40 + Math.random() * 20; p.y = 40 + Math.random() * 20; p.vy = -Math.random() * .5 - .1; p.life = 1; }
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#080810", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9000,
      overflow: "hidden", fontFamily: "'VT323',monospace"
    }}>
      {parts.current.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.r, height: p.r, borderRadius: "50%", background: p.c,
          opacity: p.life, transform: `scale(${p.life})`, pointerEvents: "none"
        }} />
      ))}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          fontFamily: "'VT323',monospace", fontSize: "clamp(40px,7vw,80px)",
          color: "#ffd700", textShadow: "0 0 20px #ffd700,0 0 50px #ff8000",
          letterSpacing: 6, lineHeight: 1.1
        }}>🏆 CHAMPION!</div>
        <div style={{ color: "#f0e8d0", fontSize: 20, marginTop: 10, letterSpacing: 2 }}>All 6 rooms cleared!</div>
        <div style={{
          background: "#000", border: "3px solid #ffd700", padding: "14px 24px",
          marginTop: 14, maxWidth: "88vw", boxShadow: "0 0 30px #ffd70044"
        }}>
          <div style={{ fontSize: 13, color: "#888", letterSpacing: 3, marginBottom: 6 }}>TREASURE FLAG</div>
          <div style={{
            fontFamily: "'VT323',monospace", fontSize: "clamp(12px,1.8vw,17px)",
            color: "#ffd700", wordBreak: "break-all", textShadow: "0 0 8px #ffd700"
          }}>{FLAG}</div>
        </div>
        <div style={{ fontSize: 13, color: "#60a860", marginTop: 10, letterSpacing: 2 }}>
          console & localStorage → rch_flag
        </div>
        <button onClick={onRestart}
          style={{
            marginTop: 16, background: "none", border: "2px solid #ffd700", color: "#ffd700",
            fontFamily: "'VT323',monospace", fontSize: 22, padding: "8px 32px", cursor: "pointer", letterSpacing: 3
          }}>
          ▶ PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(loadS);
  const [dialog, setDialog] = useState(null);
  const [showBattle, setShowBattle] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showVault, setShowVault] = useState(false);

  useEffect(() => { if (state.room >= ROOMS.length) setShowVault(true); }, [state.room]);

  function upd(patch) { setState(p => { const n = { ...p, ...patch }; saveS(n); return n; }); }

  function triggerFlash(cb) {
    setFlash(true); setTimeout(() => { setFlash(false); cb?.(); }, 500);
  }

  function handleInteract(type) {
    const ri = state.room;
    if (type === "npc") {
      setDialog({ lines: ROOMS[ri].npcLines || ["..."], type: "npc" });
    } else if (type === "scroll") {
      if (!state.hintRead.includes(ri)) upd({ hintRead: [...state.hintRead, ri] });
      setDialog({ lines: [ROOMS[ri].hint, "📜 The scroll crackles... the puzzle terminal stirs!", "Walk to the LOCKED DOOR on the right → press Z to battle!"], type: "scroll" });
    } else if (type === "door") {
      if (state.hasKey) {
        triggerFlash(() => {
          if (ri === ROOMS.length - 1) { upd({ room: ROOMS.length }); setShowVault(true); }
          else upd({ room: ri + 1, hasKey: false });
        });
      } else if (state.solved.includes(ri)) {
        setDialog({ lines: ["You need the KEY to open this door!", "Solve the puzzle first — approach the LOCKED door and press Z."], type: "info" });
      } else {
        setDialog({ lines: ["The door is sealed shut!", state.hintRead.includes(ri) ? "Press Z near the LOCKED door to start the battle." : "Find the HINT SCROLL first (glowing chest 📦)"], type: "info" });
      }
    } else if (type === "locked") {
      if (state.hintRead.includes(ri)) {
        triggerFlash(() => setShowBattle(true));
      } else {
        setDialog({ lines: ["This door won't budge!", "Find and read the HINT SCROLL first.", "(Look for the glowing chest on the map)"], type: "info" });
      }
    }
  }

  function handleBattleSolve() {
    const ri = state.room;
    const solved = state.solved.includes(ri) ? state.solved : [...state.solved, ri];
    upd({ solved, hasKey: true });
  }

  function handleRestart() {
    const ns = { room: 0, solved: [], hintRead: [], hasKey: false };
    setState(ns); saveS(ns); setShowVault(false); setDialog(null); setShowBattle(false);
  }

  if (showVault) return <VaultScreen onRestart={handleRestart} />;

  return (
    <div style={{ background: "#080810", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#444}
      `}</style>

      {/* White flash transition */}
      <div style={{
        position: "fixed", inset: 0, background: "#fff",
        opacity: flash ? 1 : 0, pointerEvents: "none", zIndex: 5000, transition: flash ? "none" : "opacity .4s"
      }} />

      <GBAShell>
        <GameCanvas
          key={state.room}
          state={state}
          onInteract={handleInteract}
          dialogLines={dialog?.lines || null}
          onDialogDone={() => setDialog(null)}
          showBattle={showBattle}
          onBattleSolve={handleBattleSolve}
          onBattleClose={() => setShowBattle(false)}
        />
      </GBAShell>
    </div>
  );
}