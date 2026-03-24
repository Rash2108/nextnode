import { useState, useEffect, useRef, useCallback, Fragment } from "react";

// ─── DATA ──────────────────────────────────────────────────────────────────────
const VALID_TOKENS = [
    "CTF{g33ks_hunt3r_m4st3r_2024}",
    "CTF{c0d3_hunt3r_3l1t3_2024}",
    "CTF{tr34sur3_hunt_m4st3r_2024}",
];

const ANSWERS = {
    1: "GHOST",
    2: "NODE",
    3: "404",
    4: "MATRIX",
    5: "CIPHER",
    6: "VECTOR",
    7: "CORE",
};

const FINAL_PW = "GHOSTNODE404MATRIXCIPHERVECTORCORE";
const R3_TOKEN = "VAULT_OMEGA_PRIME";
const TOTAL_TIME = 45 * 60; // seconds

const PUZZLE_META = [
    { id: 1, frag: "GHOST", label: "ELEMENTS LAYER", badge: "ELEMENTS", color: "#00e5ff" },
    { id: 2, frag: "NODE", label: "NETWORK LAYER", badge: "NETWORK", color: "#00ff9f" },
    { id: 3, frag: "404", label: "CONSOLE LAYER", badge: "CONSOLE", color: "#ffb300" },
    { id: 4, frag: "MATRIX", label: "LOCAL STORAGE", badge: "APPLICATION", color: "#b44fff" },
    { id: 5, frag: "CIPHER", label: "COOKIE JAR", badge: "COOKIES", color: "#ff6b35" },
    { id: 6, frag: "VECTOR", label: "SOURCE DECODE", badge: "SOURCES", color: "#4488ff" },
    { id: 7, frag: "CORE", label: "OBJECT TRAVERSAL", badge: "CONSOLE", color: "#ff3d5a" },
];

// ─── GLOBAL STYLE INJECTION ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020508;--s1:#06090f;--s2:#0a1018;
  --border:#0f1e2e;--border2:#162840;
  --cyan:#00e5ff;--green:#00ff9f;--amber:#ffb300;
  --red:#ff3d5a;--purple:#b44fff;--blue:#4488ff;--orange:#ff6b35;--gold:#e8a838;
  --text:#b0cce0;--dim:#2a4560;--dimmer:#0f1e2c;
}
html,body{background:var(--bg);font-family:'Share Tech Mono',monospace;color:var(--text)}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9000;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.018) 2px,rgba(0,0,0,0.018) 4px)}
input,button{font-family:inherit}
input::placeholder{color:var(--dimmer);font-size:11px}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
kbd{background:var(--s2);border:1px solid var(--border2);border-radius:3px;padding:1px 6px;font-family:'Share Tech Mono',monospace;font-size:.85em;color:var(--cyan)}
code{color:var(--cyan);font-family:'Share Tech Mono',monospace;font-size:.9em}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{to{transform:translateX(100%)}}
@keyframes scanline{0%{top:0;opacity:0}5%{opacity:.6}95%{opacity:.6}100%{top:100%;opacity:0}}
@keyframes glitch{0%,90%,100%{clip-path:none;transform:none}91%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-4px)}93%{clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%);transform:translateX(4px)}95%{clip-path:none;transform:none}}
@keyframes countdownPulse{0%,100%{color:#ff3d5a;text-shadow:0 0 20px #ff3d5a}50%{color:#ff8fa0;text-shadow:0 0 40px #ff3d5a}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.shake-anim{animation:shake .5s ease}
.fadein{animation:fadeUp .6s ease}
`;

// ─── SMALL HELPERS ─────────────────────────────────────────────────────────────
function injectCSS() {
    if (document.getElementById("st-shadow-trace")) return;
    const s = document.createElement("style");
    s.id = "st-shadow-trace";
    s.textContent = CSS;
    document.head.appendChild(s);
}

function Corner({ color = "var(--cyan)" }) {
    const base = { position: "absolute", width: 12, height: 12, borderColor: color, borderStyle: "solid", opacity: .55 };
    return (<>
        <span style={{ ...base, top: 7, left: 7, borderWidth: "1px 0 0 1px" }} />
        <span style={{ ...base, top: 7, right: 7, borderWidth: "1px 1px 0 0" }} />
        <span style={{ ...base, bottom: 7, left: 7, borderWidth: "0 0 1px 1px" }} />
        <span style={{ ...base, bottom: 7, right: 7, borderWidth: "0 1px 1px 0" }} />
    </>);
}

function GridBg() {
    return (
        <div style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",
            backgroundSize: "50px 50px", opacity: .28,
        }}>
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 0%,rgba(0,229,255,.05) 0%,transparent 55%), radial-gradient(ellipse at 0% 100%,rgba(0,255,159,.04) 0%,transparent 50%)",
            }} />
        </div>
    );
}

// ─── DEVTOOLS SIMULATOR PANELS ─────────────────────────────────────────────────
function DtTabBar({ tabs, active, color }) {
    return (
        <div style={{ display: "flex", background: "#13171f", borderBottom: "1px solid #2a3040", padding: "0 8px", overflowX: "auto" }}>
            {tabs.map(t => (
                <span key={t} style={{
                    padding: "7px 14px", fontSize: 10, letterSpacing: 1, whiteSpace: "nowrap",
                    color: t === active ? color : "#4a6080",
                    borderBottom: t === active ? `2px solid ${color}` : "2px solid transparent",
                }}>{t}</span>
            ))}
        </div>
    );
}

function SimElements() {
    return (
        <div style={{ background: "#1a1e24", border: "1px solid #2a3040", borderRadius: 6, overflow: "hidden", fontSize: 11 }}>
            <DtTabBar tabs={["Elements", "Console", "Network"]} active="Elements" color="var(--cyan)" />
            <div style={{ padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace", lineHeight: 1.9, fontSize: 10, color: "#8899aa" }}>
                <div><span style={{ color: "#5899dd" }}>&lt;head&gt;</span></div>
                <div style={{ paddingLeft: 16 }}><span style={{ color: "#5899dd" }}>&lt;meta</span> <span style={{ color: "#e8a838" }}>charset</span>=<span style={{ color: "#78c47a" }}>"UTF-8"</span><span style={{ color: "#5899dd" }}>{"/"}&gt;</span></div>
                <div style={{ paddingLeft: 16 }}><span style={{ color: "#5899dd" }}>&lt;title&gt;</span>Shadow Trace<span style={{ color: "#5899dd" }}>&lt;/title&gt;</span></div>
                <div style={{ paddingLeft: 16, background: "rgba(0,255,159,.08)", borderLeft: "2px solid var(--green)", paddingBlock: 2 }}>
                    <span style={{ color: "#4a6a3a", fontStyle: "italic" }}>{`<!-- KEY_FRAGMENT_1 = "GHOST" -->`}</span>
                </div>
                <div style={{ paddingLeft: 16 }}><span style={{ color: "#5899dd" }}>&lt;link</span> <span style={{ color: "#e8a838" }}>rel</span>=<span style={{ color: "#78c47a" }}>"stylesheet"</span><span style={{ color: "#5899dd" }}>{"/"}&gt;</span></div>
                <div><span style={{ color: "#5899dd" }}>&lt;/head&gt;</span></div>
            </div>
        </div>
    );
}

function SimNetwork() {
    const [open, setOpen] = useState(false);
    const row = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, fontSize: 10, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.03)", color: "#8899aa", borderRadius: 2 };
    return (
        <div style={{ background: "#1a1e24", border: "1px solid #2a3040", borderRadius: 6, overflow: "hidden", fontSize: 11 }}>
            <DtTabBar tabs={["Elements", "Network", "Console"]} active="Network" color="var(--green)" />
            <div style={{ padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, fontSize: 9, color: "var(--dim)", letterSpacing: 1, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 6 }}>
                    <span>Name</span><span>Method</span><span>Status</span><span>Type</span>
                </div>
                <div style={row}><span>round2-shadow...</span><span style={{ color: "var(--green)" }}>GET</span><span style={{ color: "var(--green)" }}>200</span><span>document</span></div>
                <div style={{ ...row, background: open ? "rgba(0,229,255,.04)" : "transparent", cursor: "pointer" }} onClick={() => setOpen(v => !v)}>
                    <span style={{ color: "var(--green)" }}>▶ /api/shadow/logs</span>
                    <span style={{ color: "var(--green)" }}>GET</span><span style={{ color: "var(--green)" }}>200</span><span>fetch</span>
                </div>
                <div style={{ color: "#8899aa", fontSize: 10 }}>fonts.googleapis...</div>
                {open && (
                    <pre style={{ marginTop: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 3, padding: 10, fontSize: 10, color: "var(--green)", overflowX: "auto" }}>
                        {`// Response · /api/shadow/logs
{
  "fragment": "NODE",
  "timestamp": "2024-03-13T20:28:00Z",
  "status": "breach_active",
  "agent": "shadow_tracer"
}`}
                    </pre>
                )}
            </div>
        </div>
    );
}

function SimConsole({ lines }) {
    return (
        <div style={{ background: "#1a1e24", border: "1px solid #2a3040", borderRadius: 6, overflow: "hidden", fontSize: 11 }}>
            <DtTabBar tabs={["Elements", "Console", "Sources"]} active="Console" color="var(--amber)" />
            <div style={{ padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace" }}>
                {lines.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.02)" }}>
                        <span style={{ color: "var(--dim)", flexShrink: 0 }}>{l.prompt || "›"}</span>
                        <span style={{ color: l.color || "#e0eeff" }}>{l.text}</span>
                    </div>
                ))}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                    <span style={{ color: "var(--cyan)", flexShrink: 0 }}>›</span>
                    <input readOnly placeholder="Try it in real DevTools too..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0eeff", fontFamily: "'Share Tech Mono',monospace", fontSize: 11 }} />
                </div>
            </div>
        </div>
    );
}

function SimStorage({ rows, highlightKey, highlightColor, columns = ["Key", "Value"], title = "▸ Storage › Local Storage › file://" }) {
    return (
        <div style={{ background: "#1a1e24", border: "1px solid #2a3040", borderRadius: 6, overflow: "hidden", fontSize: 11 }}>
            <DtTabBar tabs={["Application", "Network"]} active="Application" color={highlightColor} />
            <div style={{ padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace" }}>
                <div style={{ fontSize: 9, color: "var(--dim)", marginBottom: 8, letterSpacing: 2 }}>{title}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead><tr>{columns.map(c => <th key={c} style={{ color: "var(--dim)", fontWeight: 400, letterSpacing: 2, padding: "5px 8px", textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: 9 }}>{c}</th>)}</tr></thead>
                    <tbody>
                        {rows.map((r, i) => {
                            const hl = r[0] === highlightKey;
                            return (
                                <tr key={i}>
                                    {r.map((cell, j) => (
                                        <td key={j} style={{ padding: "5px 8px", borderBottom: "1px solid rgba(255,255,255,.03)", color: hl ? highlightColor : "#8899aa", background: hl ? `${highlightColor}0d` : "transparent", fontWeight: hl && j === 1 ? "bold" : 400 }}>{cell}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SimSource() {
    const lines = [
        { num: 48, code: <span><span style={{ color: "#3a5040" }}>{"// System internals — do not expose"}</span></span>, hl: false },
        { num: 49, code: <span><span style={{ color: "#cc7be8" }}>const</span> <span style={{ color: "#e8d87a" }}>_enc_fragment</span> = <span style={{ color: "#78c47a" }}>"VkVDVE9S"</span>;</span>, hl: false },
        { num: 50, code: <span><span style={{ color: "#3a5040" }}>{"// ^ decode with atob() in Console"}</span></span>, hl: true },
        { num: 51, code: <span><span style={{ color: "#cc7be8" }}>const</span> <span style={{ color: "#5baef5" }}>decode</span> = (<span style={{ color: "#e8d87a" }}>s</span>) =&gt; <span style={{ color: "#5baef5" }}>atob</span>(<span style={{ color: "#e8d87a" }}>s</span>);</span>, hl: false },
    ];
    return (
        <div style={{ background: "#1a1e24", border: "1px solid #2a3040", borderRadius: 6, overflow: "hidden", fontSize: 11 }}>
            <DtTabBar tabs={["Sources", "Console"]} active="Sources" color="var(--blue)" />
            <div style={{ padding: "12px 14px", fontFamily: "'Share Tech Mono',monospace" }}>
                {lines.map(l => (
                    <div key={l.num} style={{ display: "flex", gap: 12, lineHeight: 2, background: l.hl ? "rgba(255,61,90,.08)" : "transparent", borderLeft: l.hl ? "2px solid var(--red)" : "2px solid transparent", paddingLeft: l.hl ? 4 : 4 }}>
                        <span style={{ color: "var(--dimmer)", minWidth: 24, textAlign: "right", userSelect: "none" }}>{l.num}</span>
                        <span style={{ color: "#7a9ab8" }}>{l.code}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SimObjConsole() {
    return (
        <SimConsole lines={[
            { text: "window.__sys" },
            { prompt: " ", text: <span style={{ color: "var(--green)" }}>▸ {"{ breach: { node: { deep: [Object] } } }"}</span> },
            { text: "window.__sys.breach.node.deep" },
            { prompt: " ", text: <span style={{ color: "var(--green)" }}>▸ {"{ "}<span style={{ color: "var(--amber)" }}>fragment</span>{': "'}<span style={{ color: "var(--red)" }}>CORE</span>{'", locked: false }'}</span> },
        ]} />
    );
}

// ─── PUZZLE CARD ───────────────────────────────────────────────────────────────
function PuzzleCard({ meta, isSolved, onSolve, hintVisible, onHintReveal }) {
    const [input, setInput] = useState("");
    const [shake, setShake] = useState(false);
    const { id, frag, label, badge, color } = meta;

    const handleCheck = () => {
        if (input.trim().toUpperCase() === ANSWERS[id]) {
            onSolve(id);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    };

    const cardStyle = {
        background: "var(--s1)", border: `1px solid ${isSolved ? color : "var(--border)"}`,
        borderRadius: 8, padding: 22, display: "flex", flexDirection: "column", gap: 13,
        position: "relative", overflow: "hidden",
        boxShadow: isSolved ? `0 0 28px ${color}22` : "none",
        transition: "border-color .3s, box-shadow .3s",
        animation: shake ? "shake .5s ease" : "none",
    };

    const sn = (txt, c = color) => (
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, flexShrink: 0, marginTop: 2, background: `${c}12`, color: c }}>{txt}</span>
    );

    const qboxStyle = (c = color) => ({
        background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#d8eeff", lineHeight: 1.7,
    });

    const inputRowStyle = { display: "flex", gap: 8, marginTop: "auto" };
    const iptStyle = { flex: 1, background: "var(--bg)", border: `1px solid ${color}44`, borderRadius: 4, padding: "10px 14px", color: "var(--text)", fontFamily: "'Share Tech Mono',monospace", fontSize: 13, letterSpacing: 2, outline: "none", textTransform: "uppercase" };
    const btnStyle = { background: "transparent", border: `1px solid ${color}`, borderRadius: 4, color, width: 44, cursor: "pointer", fontSize: 16 };

    return (
        <div style={cardStyle}>
            {/* Top glow line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: .4 }} />
            {/* Scan line */}
            <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color},transparent)`, animation: "scanline 7s linear infinite", opacity: 0, pointerEvents: "none" }} />
            <Corner color={color} />

            {isSolved ? (
                /* ── SOLVED ── */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 32, color }}>{`✓`}</div>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 700, letterSpacing: 5, color, textShadow: `0 0 18px ${color}` }}>{frag}</div>
                    <div style={{ fontSize: 9, color: "var(--dim)", letterSpacing: 3 }}>FRAGMENT {String(id).padStart(2, "0")} RECOVERED</div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 3, color, marginBottom: 4 }}>FRAGMENT {String(id).padStart(2, "0")}</div>
                            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: 2 }}>{label}</div>
                        </div>
                        <span style={{ fontSize: 9, letterSpacing: 1, padding: "3px 8px", border: `1px solid ${color}`, borderRadius: 2, color, opacity: .8, flexShrink: 0, marginTop: 2 }}>{badge}</span>
                    </div>

                    {/* Intel hint */}
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderLeft: `2px solid ${color}`, borderRadius: 4, padding: "10px 14px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--dim)", marginBottom: 5 }}>// INTEL</div>
                        <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.8, opacity: .85 }}>
                            {id === 1 && <>The actor left a signature in the page structure itself. <em style={{ color: "var(--dim)" }}>HTML is never truly invisible.</em></>}
                            {id === 2 && <>The system is making hidden calls. <em style={{ color: "var(--dim)" }}>Watch the traffic when the page loads.</em></>}
                            {id === 3 && <>The system exposes a trace function. <em style={{ color: "var(--dim)" }}>Call it — it answers.</em></>}
                            {id === 4 && <>Agents leave traces in persistent memory. <em style={{ color: "var(--dim)" }}>The browser stores more than you think.</em></>}
                            {id === 5 && <>The agent left a crumb trail. <em style={{ color: "var(--dim)" }}>Cookies expire — but not before you find it.</em></>}
                            {id === 6 && <>The fragment is hidden in the source — but <strong style={{ color }}>encoded</strong>. You must decode it first. <em style={{ color: "var(--dim)" }}>Developers love Base64.</em></>}
                            {id === 7 && <>The final piece is buried deep in a nested object. <em style={{ color: "var(--dim)" }}>Navigate the structure — one dot at a time.</em></>}
                        </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {id === 1 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Press <kbd>F12</kbd> to open DevTools</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Go to the <kbd>Elements</kbd> tab and expand the <code>&lt;head&gt;</code> tag</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Look for an HTML comment containing <code>KEY_FRAGMENT_1</code></span></div>
                        </>}
                        {id === 2 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Network</kbd> tab, then <strong>reload</strong> the page (<kbd>F5</kbd>)</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Filter by <kbd>Fetch/XHR</kbd> and find the request to <code style={{ color: "var(--green)" }}>/api/shadow/logs</code></span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Click it → <kbd>Response</kbd> tab → read the <code>"fragment"</code> value</span></div>
                        </>}
                        {id === 3 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Console</kbd> tab</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Type exactly: <code style={{ color }}>window.__shadowTrace()</code> and press <kbd>Enter</kbd></span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Read the <code>fragment</code> value from the returned object</span></div>
                        </>}
                        {id === 4 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Application</kbd> tab</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Sidebar: <kbd>Storage</kbd> → <kbd>Local Storage</kbd> → click your site URL</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Find the key <code style={{ color }}>shadow_trace_key</code> and read its value</span></div>
                        </>}
                        {id === 5 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Application</kbd> tab</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Sidebar: <kbd>Storage</kbd> → <kbd>Cookies</kbd> → click your site URL</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Find the cookie <code style={{ color }}>_shadow_crumb</code> and read its value</span></div>
                        </>}
                        {id === 6 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Sources</kbd> → find this page's file</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Use <kbd>Ctrl+F</kbd> to search for <code style={{ color }}>_enc_fragment</code></span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Decode the Base64 string in Console: <code>atob("VkVDVE9S")</code></span></div>
                        </>}
                        {id === 7 && <>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("01")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Open DevTools → <kbd>Console</kbd></span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("02")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Type <code style={{ color }}>window.__sys</code> and press Enter to inspect the object</span></div>
                            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{sn("03")}<span style={{ fontSize: 11, lineHeight: 1.7, opacity: .85 }}>Drill down to find the hidden fragment using dot notation</span></div>
                        </>}
                    </div>

                    {/* DevTools Simulator */}
                    {id === 1 && <SimElements />}
                    {id === 2 && <SimNetwork />}
                    {id === 3 && <SimConsole lines={[
                        { text: "window.__shadowTrace()" },
                        { prompt: " ", text: <span style={{ color: "var(--green)" }}>{`▸ Object { fragment: "`}<span style={{ color: "var(--amber)" }}>404</span>{`", system: "NodeCore-7", clearance: "AGENT" }`}</span> },
                    ]} />}
                    {id === 4 && <SimStorage highlightKey="shadow_trace_key" highlightColor="var(--purple)" rows={[["round2_status", "active"], ["agent_id", "SHD-7791"], ["shadow_trace_key", "MATRIX"], ["breach_ts", "1710359280"]]} />}
                    {id === 5 && <SimStorage highlightKey="_shadow_crumb" highlightColor="var(--orange)" columns={["Name", "Value", "Expires"]} title="▸ Storage › Cookies › file://" rows={[["session_id", "a3f7...9c2", "Session"], ["_shadow_crumb", "CIPHER", "2024-03-14"], ["round", "2", "Session"]]} />}
                    {id === 6 && <SimSource />}
                    {id === 7 && <SimObjConsole />}

                    {/* Question */}
                    <div style={qboxStyle(color)}>
                        {id === 1 && <>❓ What is the value assigned to <code>KEY_FRAGMENT_1</code> in the HTML comment?</>}
                        {id === 2 && <>❓ What is the value of the <code style={{ color: "var(--green)" }}>"fragment"</code> key in the <code>/api/shadow/logs</code> response?</>}
                        {id === 3 && <>❓ Call <code style={{ color }}>window.__shadowTrace()</code> in DevTools Console. What is the <code>fragment</code> value?</>}
                        {id === 4 && <>❓ What is the value stored under <code style={{ color }}>shadow_trace_key</code> in Local Storage?</>}
                        {id === 5 && <>❓ What is the value of the cookie named <code style={{ color }}>_shadow_crumb</code>?</>}
                        {id === 6 && <>❓ Decode <code style={{ color }}>"VkVDVE9S"</code> using <code>atob()</code> in Console. What word does it spell?</>}
                        {id === 7 && <>❓ What is <code style={{ color }}>window.__sys.breach.node.deep.fragment</code> in the Console?</>}
                    </div>

                    {/* Hint reveal */}
                    {hintVisible && (
                        <div style={{ fontSize: 10, color: "var(--amber)", background: "rgba(255,179,0,.06)", border: "1px solid rgba(255,179,0,.2)", borderRadius: 4, padding: "8px 12px", lineHeight: 1.7, animation: "fadeUp .3s ease" }}>
                            {id === 1 && <>💡 DevTools → Elements → expand &lt;head&gt;. The comment is visible in the simulator above — or find it in the real page source.</>}
                            {id === 2 && <>💡 Click the <code>/api/shadow/logs</code> row in the simulator to reveal the response. In real DevTools: Network tab → reload → click that request → Response tab.</>}
                            {id === 3 && <>💡 Open real DevTools (F12) → Console → type <code>window.__shadowTrace()</code> and press Enter. The fragment is in the returned object.</>}
                            {id === 4 && <>💡 DevTools → Application → Local Storage → your URL. The key <code>shadow_trace_key</code> is planted there when you log in.</>}
                            {id === 5 && <>💡 DevTools → Application → Cookies. The cookie <code>_shadow_crumb</code> is set via <code>document.cookie</code> on login.</>}
                            {id === 6 && <>💡 DevTools → Console → type: <code>atob("VkVDVE9S")</code> and press Enter. The decoded string is your fragment.</>}
                            {id === 7 && <>💡 In Console type: <code>window.__sys.breach.node.deep.fragment</code> and press Enter.</>}
                        </div>
                    )}

                    {/* Input */}
                    <div style={inputRowStyle}>
                        <input style={iptStyle} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCheck()} placeholder="Enter fragment..." />
                        <button style={btnStyle} onClick={handleCheck}>▶</button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function Hud({ timerSec, solved, onHintClick, hintsLeft, showPenalty }) {
    const m = Math.floor(Math.max(0, timerSec) / 60);
    const s = Math.max(0, timerSec) % 60;
    const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const timerColor = timerSec <= 60 ? "var(--red)" : timerSec <= 300 ? "var(--amber)" : "var(--green)";
    const timerAnim = timerSec <= 60 ? "countdownPulse .5s infinite" : "none";
    return (
        <div style={{ position: "sticky", top: 0, zIndex: 500, background: "rgba(2,5,8,.93)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border2)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900, color: "var(--cyan)", letterSpacing: 3 }}>SHADOW TRACE</span>
            <div style={{ width: 1, height: 24, background: "var(--border2)" }} />
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 700, letterSpacing: 2, color: timerColor, animation: timerAnim, minWidth: 80 }}>{label}</span>
            <div style={{ width: 1, height: 24, background: "var(--border2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 140 }}>
                <div style={{ flex: 1, height: 3, background: "var(--dimmer)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(solved / 7) * 100}%`, background: "linear-gradient(90deg,var(--cyan),var(--green))", transition: "width .5s ease", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap" }}>{solved} / 7</span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--border2)" }} />
            <button
                onClick={hintsLeft > 0 ? onHintClick : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "6px 14px", border: "1px solid var(--border2)", borderRadius: 4, background: "transparent", color: "var(--text)", cursor: hintsLeft > 0 ? "pointer" : "not-allowed", opacity: hintsLeft === 0 ? .4 : 1, transition: "border-color .2s" }}
            >
                <span style={{ fontSize: 10, color: "var(--amber)", letterSpacing: 2 }}>HINTS</span>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < hintsLeft ? "var(--amber)" : "var(--dimmer)", boxShadow: i < hintsLeft ? "0 0 6px var(--amber)" : "none", transition: "all .3s" }} />)}
            </button>
            {showPenalty && <span style={{ fontSize: 10, color: "var(--red)", animation: "fadeUp .3s ease" }}>−30s PENALTY</span>}
        </div>
    );
}

// ─── HINT MODAL ────────────────────────────────────────────────────────────────
function HintModal({ unsolvedIds, onUse, onClose }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp .3s ease" }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: "var(--s2)", border: "1px solid var(--amber)", borderRadius: 8, padding: "28px 32px", maxWidth: 440, width: "90%" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: "var(--amber)", letterSpacing: 3, marginBottom: 12 }}>⚠ USE A HINT?</div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.9, marginBottom: 8 }}>Select which puzzle you want a hint for. Each hint reveals a guidance clue directly on the card.</div>
                <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: 2, marginBottom: 16 }}>PENALTY: −30 SECONDS FROM YOUR TIME</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
                    {unsolvedIds.map(id => {
                        const m = PUZZLE_META.find(p => p.id === id);
                        return (
                            <button key={id} onClick={() => onUse(id)} style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: 4, padding: "8px 14px", color: "var(--text)", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, cursor: "pointer", textAlign: "left" }}>
                                Puzzle {id} — {m.label}
                            </button>
                        );
                    })}
                    {unsolvedIds.length === 0 && <div style={{ fontSize: 11, color: "var(--dim)" }}>All puzzles solved!</div>}
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: 4, padding: "10px 20px", color: "var(--dim)", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, cursor: "pointer" }}>CANCEL</button>
            </div>
        </div>
    );
}

// ─── WIN SCREEN ────────────────────────────────────────────────────────────────
function WinScreen({ elapsed, penaltySec, onClose }) {
    const total = elapsed + penaltySec;
    const fmt = s => `${Math.floor(s / 60)}m ${s % 60}s`;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.94)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24, textAlign: "center", animation: "fadeUp .6s ease" }}>
            <div style={{ fontSize: 60, color: "var(--gold)", textShadow: "0 0 40px var(--gold)", animation: "spin 6s linear infinite" }}>★</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(22px,5vw,46px)", fontWeight: 900, color: "var(--gold)", letterSpacing: 6, textShadow: "0 0 40px var(--gold)" }}>BREACH SEALED</div>
            <div style={{ fontSize: 12, color: "var(--text)", opacity: .75, letterSpacing: 1, maxWidth: 480, lineHeight: 1.9 }}>
                Outstanding work, Agent. All 7 fragments of <strong>NodeCore-7</strong> have been recovered and the breach vector has been identified. The system is now secure.
            </div>
            <div style={{ background: "var(--s1)", border: "1px solid var(--gold)", borderRadius: 6, padding: "16px 32px", fontSize: 16, color: "var(--gold)", letterSpacing: 3, boxShadow: "0 0 30px rgba(232,168,56,.15)" }}>
                ROUND 3 TOKEN: {R3_TOKEN}
            </div>
            <div style={{ fontSize: 12, color: "var(--cyan)", letterSpacing: 2 }}>
                ⏱ {fmt(elapsed)} raw &nbsp;+&nbsp; {penaltySec}s penalty &nbsp;=&nbsp; <strong>{fmt(total)}</strong> total
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--dim)", borderRadius: 4, padding: "10px 24px", color: "var(--dim)", fontFamily: "'Share Tech Mono',monospace", fontSize: 12, cursor: "pointer", letterSpacing: 2 }}>
                PROCEED TO ROUND 3 →
            </button>
        </div>
    );
}

// ─── ACCESS GATE ───────────────────────────────────────────────────────────────
function AccessGate({ onAuth }) {
    const [val, setVal] = useState("");
    const [err, setErr] = useState(false);
    const [shake, setShake] = useState(false);

    const attempt = () => {
        if (VALID_TOKENS.includes(val.trim())) {
            onAuth(val.trim());
        } else {
            setErr(true);
            setShake(true);
            setTimeout(() => { setErr(false); setShake(false); }, 1500);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeUp .6s ease" }}>
            <p style={{ fontSize: 10, letterSpacing: 6, color: "var(--dim)", marginBottom: 14, textAlign: "center" }}>◈ VIRTUAL TREASURE HUNT · ROUND 2 OF 3 ◈</p>
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "clamp(26px,6vw,62px)", letterSpacing: 8, color: "var(--cyan)", textAlign: "center", textShadow: "0 0 40px rgba(0,229,255,.5),0 0 80px rgba(0,229,255,.15)", marginBottom: 8, position: "relative" }}>
                SHADOW TRACE
                <span style={{ position: "absolute", inset: 0, color: "#ff3d5a", animation: "glitch 4s infinite", pointerEvents: "none" }} aria-hidden>SHADOW TRACE</span>
            </h1>
            <p style={{ fontSize: 11, color: "var(--dim)", letterSpacing: 3, textAlign: "center", marginBottom: 40 }}>BREACH INVESTIGATION PROTOCOL · CLEARANCE REQUIRED</p>

            <div style={{ background: "var(--s1)", border: "1px solid var(--border2)", borderRadius: 8, padding: "36px 40px", width: "100%", maxWidth: 500, position: "relative", animation: shake ? "shake .5s ease" : "none" }}>
                <Corner color="var(--cyan)" />
                {/* Breach log */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: 14, marginBottom: 20, fontSize: 10, lineHeight: 2, maxHeight: 120, overflow: "hidden" }}>
                    {[
                        { t: "[!] BREACH DETECTED — SYSTEM: NodeCore-7", c: "var(--red)" },
                        { t: "[*] Unknown agent accessed restricted endpoints", c: "var(--cyan)" },
                        { t: "[*] 7 data fragments scattered across the system", c: "var(--cyan)" },
                        { t: "[!] Recovery window: 45:00 minutes", c: "var(--red)" },
                        { t: "[+] Awaiting investigator authentication...", c: "var(--green)" },
                    ].map((l, i) => <span key={i} style={{ display: "block", color: l.c }}>{l.t}</span>)}
                </div>

                <p style={{ fontSize: 10, letterSpacing: 3, color: "var(--dim)", marginBottom: 10 }}>// ENTER ROUND 1 ACCESS TOKEN</p>
                <input
                    value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()}
                    placeholder="CTF{...}" autoComplete="off" spellCheck={false}
                    style={{ width: "100%", background: "var(--bg)", border: `1px solid ${err ? "var(--red)" : "var(--border2)"}`, borderRadius: 4, padding: "14px 16px", color: "var(--cyan)", fontFamily: "'Share Tech Mono',monospace", fontSize: 14, letterSpacing: 2, outline: "none", marginBottom: 14, transition: "border-color .2s" }}
                />
                <button onClick={attempt} style={{ width: "100%", background: "transparent", border: "1px solid var(--cyan)", borderRadius: 4, padding: 14, color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 4, cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    AUTHENTICATE &nbsp;▶
                    <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(0,229,255,.08),transparent)", transform: "translateX(-100%)", animation: "shimmer 2.5s infinite" }} />
                </button>
                {err && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 10, textAlign: "center", letterSpacing: 1, animation: "fadeUp .2s ease" }}>✗ INVALID TOKEN — Complete Round 1 first</p>}
                <p style={{ marginTop: 20, fontSize: 10, color: "var(--dim)", textAlign: "center", lineHeight: 1.8 }}>
                    Complete Round 1 to receive your access token.<br />
                    Token format: <span style={{ color: "var(--cyan)" }}>CTF{"{"}<span style={{ color: "var(--dim)" }}>...</span>{"}"}</span>
                </p>
            </div>
        </div>
    );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function ShadowTrace() {
    useEffect(() => { injectCSS(); }, []);

    // Plant clues in window/storage on mount (needed for real DevTools puzzles)
    useEffect(() => {
        // Puzzle 3 — console function
        window.__shadowTrace = function () {
            const payload = { fragment: "404", system: "NodeCore-7", clearance: "AGENT" };
            console.log("%c[SHADOW TRACE] Fragment located:", "color:#ffb300;font-weight:bold;font-size:12px;");
            console.log(payload);
            return payload;
        };
        // Puzzle 6 — source variable (visible in Sources tab)
        window._enc_fragment = "VkVDVE9S"; // atob → "VECTOR"
        // Puzzle 7 — nested object
        window.__sys = { breach: { node: { deep: { fragment: "CORE", locked: false, agent: "shadow_tracer" } } } };
    }, []);

    const [authed, setAuthed] = useState(false);
    const [solved, setSolved] = useState(new Set());
    const [hintVisible, setHintVisible] = useState({});
    const [hintsLeft, setHintsLeft] = useState(3);
    const [showHintModal, setShowHintModal] = useState(false);
    const [showPenalty, setShowPenalty] = useState(false);
    const [timerSec, setTimerSec] = useState(TOTAL_TIME);
    const [timerRunning, setTimerRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [won, setWon] = useState(false);
    const [winElapsed, setWinElapsed] = useState(0);
    const [finalInput, setFinalInput] = useState("");
    const [finalErr, setFinalErr] = useState(false);
    const timerRef = useRef(null);

    // Timer
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSec(s => Math.max(0, s - 1));
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    const handleAuth = useCallback((token) => {
        // Plant storage clues
        try {
            localStorage.setItem("shadow_trace_key", "MATRIX");
            localStorage.setItem("round2_status", "active");
            localStorage.setItem("agent_id", "SHD-7791");
            document.cookie = "_shadow_crumb=CIPHER; path=/; SameSite=Strict";
            document.cookie = "session_id=a3f7c9d2; path=/; SameSite=Strict";
        } catch (e) { }

        console.clear();
        console.log("%c╔════════════════════════════════════════════╗", "color:#00e5ff;font-size:13px;");
        console.log("%c║   SHADOW TRACE — BREACH INVESTIGATION       ║", "color:#00e5ff;font-size:13px;font-weight:bold;");
        console.log("%c╚════════════════════════════════════════════╝", "color:#00e5ff;font-size:13px;");
        console.log("%c\n7 fragments hidden across this page. Investigate every DevTools layer.\n", "color:#2a4560;font-size:11px;");
        console.log("%c💡 PUZZLE 3: Try  window.__shadowTrace()", "color:#ffb300;font-size:12px;");
        console.log("%c💡 PUZZLE 7: Try  window.__sys", "color:#ff3d5a;font-size:12px;");

        setAuthed(true);
        setStartTime(Date.now());
        setTimerRunning(true);
    }, []);

    const handleSolve = useCallback((id) => {
        setSolved(prev => new Set([...prev, id]));
    }, []);

    const handleUseHint = useCallback((id) => {
        setHintsLeft(h => h - 1);
        setTimerSec(s => Math.max(0, s - 30));
        setHintVisible(h => ({ ...h, [id]: true }));
        setShowPenalty(true);
        setTimeout(() => setShowPenalty(false), 2500);
        setShowHintModal(false);
        setTimeout(() => {
            document.getElementById(`pcard-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }, []);

    const handleFinal = () => {
        if (finalInput.trim().toUpperCase() === FINAL_PW) {
            clearInterval(timerRef.current);
            const rawElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
            const penalty = (3 - hintsLeft) * 30;
            try {
                localStorage.setItem("round3_token", R3_TOKEN);
                localStorage.setItem("round2_cleared", "true");
            } catch (e) { }
            window.__round3__ = { token: R3_TOKEN, cleared: true };
            console.clear();
            console.log("%c🏆 ROUND 2 CLEARED", "color:#e8a838;font-size:18px;font-weight:bold;");
            console.log(`%cROUND 3 TOKEN: ${R3_TOKEN}`, "color:#fff;background:#060c18;font-size:18px;font-weight:bold;padding:8px 20px;border-left:4px solid #e8a838;display:block;");
            setWinElapsed(rawElapsed);
            setWon(true);
            setFinalErr(false);
        } else {
            setFinalErr(true);
            setTimeout(() => setFinalErr(false), 2000);
        }
    };

    const solvedCount = solved.size;
    const allSolved = solvedCount === 7;

    if (!authed) return (
        <div style={{ position: "relative", zIndex: 1 }}>
            <GridBg />
            <AccessGate onAuth={handleAuth} />
        </div>
    );

    return (
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            <GridBg />

            <Hud timerSec={timerSec} solved={solvedCount} onHintClick={() => setShowHintModal(true)} hintsLeft={hintsLeft} showPenalty={showPenalty} />

            <div style={{ padding: "0 20px 80px" }}>
                {/* Story panel */}
                <div style={{ maxWidth: 1200, margin: "28px auto 24px", background: "var(--s1)", border: "1px solid var(--border2)", borderLeft: "3px solid var(--cyan)", borderRadius: 6, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,var(--cyan),transparent)" }} />
                    <div style={{ fontSize: 9, letterSpacing: 5, color: "var(--dim)", marginBottom: 10 }}>// MISSION BRIEFING — SHADOW TRACE PROTOCOL</div>
                    <div style={{ fontSize: 12, lineHeight: 2, color: "var(--text)", opacity: .85 }}>
                        Agent, you've breached the outer perimeter. The system <strong style={{ color: "var(--cyan)" }}>NodeCore-7</strong> was compromised by an unknown actor who scattered <strong style={{ color: "var(--cyan)" }}>7 encrypted fragments</strong> across different layers of the web stack.<br />
                        Your mission: use your browser's <strong style={{ color: "var(--cyan)" }}>DevTools</strong> to investigate each layer — HTML structure, network traffic, console, storage, cookies, and source code. Combine all fragments to reconstruct the master key and <strong style={{ color: "var(--cyan)" }}>seal the breach</strong>.
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {[["⚠ BREACH ACTIVE", "var(--red)"], ["● AGENT AUTHENTICATED", "var(--green)"], ["✓ DEVTOOLS REQUIRED", "var(--green)"], [`◈ ${solvedCount}/7 FRAGMENTS RECOVERED`, solvedCount === 7 ? "var(--gold)" : "var(--dim)"]].map(([t, c]) => (
                            <span key={t} style={{ fontSize: 10, padding: "4px 12px", borderRadius: 3, letterSpacing: 2, border: `1px solid ${c}`, color: c, background: `${c}0d` }}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* Puzzle grid */}
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 }}>
                    {PUZZLE_META.map(meta => (
                        <div key={meta.id} id={`pcard-${meta.id}`}>
                            <PuzzleCard
                                meta={meta}
                                isSolved={solved.has(meta.id)}
                                onSolve={handleSolve}
                                hintVisible={!!hintVisible[meta.id]}
                                onHintReveal={() => { }}
                            />
                        </div>
                    ))}
                </div>

                {/* Final section */}
                <div style={{
                    maxWidth: 1200, margin: "28px auto 0",
                    background: "var(--s1)", border: `1px solid ${allSolved ? "var(--gold)" : "var(--border2)"}`,
                    borderRadius: 8, padding: 30,
                    opacity: allSolved ? 1 : 0.3, pointerEvents: allSolved ? "all" : "none",
                    transition: "opacity .6s ease,border-color .6s,box-shadow .6s",
                    boxShadow: allSolved ? "0 0 60px rgba(232,168,56,.08)" : "none",
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,var(--gold),transparent)" }} />
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: "var(--gold)", letterSpacing: 4, marginBottom: 6 }}>⬡ RECONSTRUCT THE MASTER KEY ⬡</div>
                    <div style={{ fontSize: 10, color: "var(--dim)", letterSpacing: 2, marginBottom: 20 }}>Combine all 7 recovered fragments in order (01 → 07)</div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
                        {PUZZLE_META.map((m, i) => (
                            <Fragment key={m.id}>
                                <div style={{ background: solved.has(m.id) ? "rgba(0,255,159,.05)" : "var(--bg)", border: `1px solid ${solved.has(m.id) ? "var(--green)" : "var(--border2)"}`, borderRadius: 4, padding: "8px 14px", fontSize: 12, color: solved.has(m.id) ? "var(--green)" : "var(--dim)", letterSpacing: 2, transition: "all .4s ease", textShadow: solved.has(m.id) ? "0 0 10px var(--green)" : "none" }}>
                                    {m.frag}
                                </div>
                                {i < PUZZLE_META.length - 1 && <span style={{ color: "var(--dimmer)", fontSize: 16 }}>+</span>}
                            </Fragment>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                            value={finalInput} onChange={e => setFinalInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleFinal()}
                            placeholder="Enter combined master key..."
                            style={{ flex: 1, minWidth: 200, background: "var(--bg)", border: `1px solid ${finalErr ? "var(--red)" : "rgba(232,168,56,.5)"}`, borderRadius: 4, padding: "13px 16px", color: "var(--gold)", fontFamily: "'Share Tech Mono',monospace", fontSize: 14, letterSpacing: 2, outline: "none", textTransform: "uppercase", transition: "border-color .2s", animation: finalErr ? "shake .5s ease" : "none" }}
                        />
                        <button onClick={handleFinal} style={{ background: "transparent", border: "1px solid var(--gold)", borderRadius: 4, padding: "13px 26px", color: "var(--gold)", fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, cursor: "pointer" }}>
                            SEAL BREACH ▶
                        </button>
                    </div>
                    {finalErr && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 10, letterSpacing: 1, animation: "fadeUp .3s ease" }}>✗ Incorrect — combine all 7 fragments in order</p>}
                </div>
            </div>

            {/* Hint modal */}
            {showHintModal && (
                <HintModal
                    unsolvedIds={PUZZLE_META.filter(m => !solved.has(m.id)).map(m => m.id)}
                    onUse={handleUseHint}
                    onClose={() => setShowHintModal(false)}
                />
            )}

            {/* Win screen */}
            {won && (
                <WinScreen
                    elapsed={winElapsed}
                    penaltySec={(3 - hintsLeft) * 30}
                    onClose={() => setWon(false)}
                />
            )}
        </div>
    );
}