import { useState, useEffect, useRef, Fragment } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const VALID_TOKENS = ["LEE", "VAULT_OMEGA_PRIME"]; // Round 2 outputs
const ROUND_NEXT_TOKEN = "CIPHER_DAWN_9";

// ─── PUZZLE DATA ───────────────────────────────────────────────────────────────

// Q1 — Highlighted Letter Puzzle
const Q1_LINES = [
  {
    text: "Many ",
    segments: [
      { t: "A", hi: true },
      { t: "dvanced " },
      { t: "C", hi: true },
      { t: "omputer " },
      { t: "A", hi: true },
      { t: "pplication students enjoy solving puzzles." },
    ],
  },
  {
    text: "",
    segments: [
      { t: "Programming " },
      { t: "L", hi: true },
      { t: "ogic helps improve " },
      { t: "P", hi: true },
      { t: "roblem solving skills." },
    ],
  },
  {
    text: "",
    segments: [
      { t: "Developers " },
      { t: "H", hi: true },
      { t: "ave strong analytical thinking and always look for " },
      { t: "I", hi: true },
      { t: "nnovative solutions." },
    ],
  },
  {
    text: "",
    segments: [
      { t: "Good programmers think " },
      { t: "L", hi: true },
      { t: "ogically and " },
      { t: "T", hi: true },
      { t: "ackle problems " },
      { t: "S", hi: true },
      { t: "martly." },
    ],
  },
];
const Q1_LETTERS = ["A", "C", "A", "L", "P", "H", "I", "L", "T", "S"];
const Q1_PHRASE   = "LOGICAL PATH";
const Q1_PASSKEY  = "LOGICAL";

// Q2 — Every 3rd Word Puzzle
const Q2_SENTENCES = [
  { text: "Developers often work late nights building innovative applications.", words: ["Developers","often","work","late","nights","building","innovative","applications."], third: "work" },
  { text: "Some programmers enjoy solving logical puzzles during coding breaks.", words: ["Some","programmers","enjoy","solving","logical","puzzles","during","coding","breaks."], third: "enjoy" },
  { text: "Many students practice algorithms daily to improve their skills.", words: ["Many","students","practice","algorithms","daily","to","improve","their","skills."], third: "practice" },
];
const Q2_COLLECTED = ["WORK", "ENJOY", "PRACTICE"];
const Q2_PASSKEY   = "WEP";

// Q3 — Number Position Puzzle
const Q3_WORD      = "TREASUREHUNTISFUN";
const Q3_POSITIONS = [20, 18, 5, 1, 19, 21, 18, 5];
const Q3_ANSWER    = "TREASURE";
const Q3_PASSKEY   = "TREASURE";

// Final Key Rule
// L (first of LOGICAL) + E (middle of WEP) + E (last of TREASURE)
const FINAL_KEY = "LEE";
const FINAL_RULE = [
  { label: "Pass Key 1", key: "LOGICAL",  rule: "First letter",  letter: "L", color: "#00e5ff" },
  { label: "Pass Key 2", key: "WEP",      rule: "Middle letter", letter: "E", color: "#00ff9f" },
  { label: "Pass Key 3", key: "TREASURE", rule: "Last letter",   letter: "E", color: "#ffb300" },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020508;--s1:#06090f;--s2:#0a1018;
  --border:#0f1e2e;--border2:#162840;
  --cyan:#00e5ff;--green:#00ff9f;--amber:#ffb300;
  --red:#ff3d5a;--gold:#e8a838;--purple:#b44fff;
  --text:#b0cce0;--dim:#2a4560;--dimmer:#0f1e2c;
}
html,body{background:var(--bg);font-family:'Share Tech Mono',monospace;color:var(--text)}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9000;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.018) 2px,rgba(0,0,0,.018) 4px)}
input,button{font-family:inherit}
input::placeholder{color:var(--dimmer);font-size:11px}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
kbd{background:var(--s2);border:1px solid var(--border2);border-radius:3px;padding:1px 6px;font-family:'Share Tech Mono',monospace;font-size:.85em;color:var(--amber)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{to{transform:translateX(100%)}}
@keyframes scanline{0%{top:0;opacity:0}5%{opacity:.5}95%{opacity:.5}100%{top:100%;opacity:0}}
@keyframes glitch{0%,90%,100%{clip-path:none;transform:none}91%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-3px)}93%{clip-path:none;transform:none}}
@keyframes letterPop{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes revealKey{from{opacity:0;letter-spacing:8px}to{opacity:1;letter-spacing:4px}}
@keyframes countIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
`;

function injectStyles() {
  if (document.getElementById("hm-styles")) return;
  const s = document.createElement("style");
  s.id = "hm-styles";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{
      position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
      backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",
      backgroundSize:"50px 50px",opacity:.25,
    }}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(0,229,255,.05) 0%,transparent 55%),radial-gradient(ellipse at 90% 80%,rgba(255,179,0,.03) 0%,transparent 50%)"}} />
    </div>
  );
}

function Corner({ color="#00e5ff" }) {
  const b = { position:"absolute",width:12,height:12,borderColor:color,borderStyle:"solid",opacity:.55 };
  return (<>
    <span style={{...b,top:7,left:7,borderWidth:"1px 0 0 1px"}}/>
    <span style={{...b,top:7,right:7,borderWidth:"1px 1px 0 0"}}/>
    <span style={{...b,bottom:7,left:7,borderWidth:"0 0 1px 1px"}}/>
    <span style={{...b,bottom:7,right:7,borderWidth:"0 1px 1px 0"}}/>
  </>);
}

function SectionTag({ num, label, color="#00e5ff" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,letterSpacing:3,color,padding:"3px 10px",border:`1px solid ${color}`,borderRadius:3}}>
        PUZZLE {num}
      </div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,color:"var(--text)",letterSpacing:2}}>{label}</div>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${color}33,transparent)`}}/>
    </div>
  );
}

function HintBox({ text, color="#00e5ff" }) {
  return (
    <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderLeft:`2px solid ${color}`,borderRadius:4,padding:"10px 14px",margin:"10px 0"}}>
      <div style={{fontSize:9,letterSpacing:3,color:"var(--dim)",marginBottom:4}}>// HINT</div>
      <div style={{fontSize:11,color:"var(--text)",lineHeight:1.8,opacity:.85,fontStyle:"italic"}}>{text}</div>
    </div>
  );
}

function PassKeyReveal({ label, passkey, color }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,background:`${color}08`,border:`1px solid ${color}33`,borderRadius:6,padding:"12px 18px",marginTop:12}}>
      <div style={{fontSize:9,letterSpacing:3,color:"var(--dim)",whiteSpace:"nowrap"}}>🔐 {label}</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,color,letterSpacing:4,animation:"revealKey .6s ease",textShadow:`0 0 20px ${color}`}}>
        {passkey}
      </div>
    </div>
  );
}

function InputRow({ value, onChange, onSubmit, placeholder, color, error }) {
  return (
    <div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <input
          value={value} onChange={e=>onChange(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&onSubmit()}
          placeholder={placeholder}
          style={{
            flex:1,background:"var(--bg)",border:`1px solid ${error?"var(--red)":color+"66"}`,
            borderRadius:4,padding:"10px 14px",color:"var(--text)",
            fontFamily:"'Share Tech Mono',monospace",fontSize:13,letterSpacing:2,
            outline:"none",textTransform:"uppercase",
            animation:error?"shake .5s ease":"none",
          }}
        />
        <button onClick={onSubmit} style={{background:"transparent",border:`1px solid ${color}`,borderRadius:4,color,width:44,cursor:"pointer",fontSize:16,flexShrink:0}}>▶</button>
      </div>
      {error && <p style={{fontSize:10,color:"var(--red)",marginTop:6,letterSpacing:1,animation:"fadeUp .2s ease"}}>✗ Incorrect — read the instructions carefully and try again</p>}
    </div>
  );
}

// ─── PUZZLE 1: HIGHLIGHTED LETTERS ────────────────────────────────────────────
function Puzzle1({ onSolve, isSolved }) {
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [showPhrase, setShowPhrase]   = useState(false);
  const color = "#00e5ff";

  const check = () => {
    if (input.trim().toUpperCase() === Q1_PASSKEY) {
      onSolve(1, Q1_PASSKEY);
    } else {
      setError(true);
      setTimeout(()=>setError(false), 1500);
    }
  };

  return (
    <div style={{background:"var(--s1)",border:`1px solid ${isSolved?color:"var(--border)"}`,borderRadius:8,padding:24,position:"relative",overflow:"hidden",boxShadow:isSolved?`0 0 30px ${color}18`:"none",transition:"border-color .4s,box-shadow .4s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:.4}}/>
      <div style={{position:"absolute",left:0,right:0,height:1,animation:"scanline 8s linear infinite",background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:0,pointerEvents:"none"}}/>
      <Corner color={color}/>

      <SectionTag num="01" label="HIDDEN LETTER PUZZLE" color={color}/>

      <HintBox text='"Some letters are hiding in plain sight. They carry more weight than the rest."' color={color}/>

      {/* Paragraph with highlighted letters */}
      <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:6,padding:"16px 18px",marginBottom:14}}>
        <div style={{fontSize:9,letterSpacing:3,color:"var(--dim)",marginBottom:10}}>// READ CAREFULLY — FIND THE HIGHLIGHTED LETTERS</div>
        {Q1_LINES.map((line, li) => (
          <p key={li} style={{fontSize:12,lineHeight:2.2,color:"#8899aa",marginBottom:4}}>
            {line.segments.map((seg, si) =>
              seg.hi ? (
                <span key={si} style={{
                  color:color,fontWeight:700,fontSize:14,
                  textShadow:`0 0 12px ${color}`,
                  background:`${color}15`,
                  borderBottom:`2px solid ${color}`,
                  padding:"0 1px",
                  letterSpacing:2,
                }}>{seg.t}</span>
              ) : (
                <span key={si}>{seg.t}</span>
              )
            )}
          </p>
        ))}
      </div>

      {/* Step: Collect Letters */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:2,color:"var(--dim)"}}>STEP 1 — COLLECT HIGHLIGHTED LETTERS:</span>
        <button onClick={()=>setShowLetters(v=>!v)} style={{background:"transparent",border:`1px solid ${color}44`,borderRadius:3,padding:"3px 10px",color,fontSize:10,cursor:"pointer",letterSpacing:1}}>
          {showLetters ? "HIDE" : "REVEAL ▶"}
        </button>
      </div>

      {showLetters && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,animation:"countIn .4s ease"}}>
          {Q1_LETTERS.map((l,i) => (
            <div key={i} style={{
              width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",
              background:`${color}12`,border:`1px solid ${color}55`,borderRadius:4,
              fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,color,
              textShadow:`0 0 10px ${color}`,
              animation:`countIn .3s ease ${i*60}ms both`,
            }}>{l}</div>
          ))}
        </div>
      )}

      {/* Step: Arrange */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <span style={{fontSize:10,letterSpacing:2,color:"var(--dim)"}}>STEP 2 — ARRANGE INTO A PHRASE:</span>
        <button onClick={()=>setShowPhrase(v=>!v)} style={{background:"transparent",border:`1px solid ${color}44`,borderRadius:3,padding:"3px 10px",color,fontSize:10,cursor:"pointer",letterSpacing:1}}>
          {showPhrase ? "HIDE" : "REVEAL ▶"}
        </button>
      </div>

      {showPhrase && (
        <div style={{display:"flex",alignItems:"center",gap:10,background:`${color}08`,border:`1px solid ${color}22`,borderRadius:4,padding:"10px 16px",marginBottom:14,animation:"countIn .4s ease"}}>
          <span style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>PHRASE:</span>
          <span style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,color,letterSpacing:6,textShadow:`0 0 14px ${color}`}}>{Q1_PHRASE}</span>
        </div>
      )}

      {isSolved ? (
        <PassKeyReveal label="PASS KEY 1" passkey={Q1_PASSKEY} color={color}/>
      ) : (
        <>
          <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2,marginTop:4}}>
            STEP 3 — ENTER THE PASS KEY (the meaningful word from the phrase):
          </div>
          <InputRow value={input} onChange={setInput} onSubmit={check} placeholder="Enter pass key..." color={color} error={error}/>
        </>
      )}
    </div>
  );
}

// ─── PUZZLE 2: EVERY 3RD WORD ─────────────────────────────────────────────────
function Puzzle2({ onSolve, isSolved }) {
  const [input, setInput]         = useState("");
  const [error, setError]         = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const color = "#00ff9f";

  const check = () => {
    if (input.trim().toUpperCase() === Q2_PASSKEY) {
      onSolve(2, Q2_PASSKEY);
    } else {
      setError(true);
      setTimeout(()=>setError(false), 1500);
    }
  };

  return (
    <div style={{background:"var(--s1)",border:`1px solid ${isSolved?color:"var(--border)"}`,borderRadius:8,padding:24,position:"relative",overflow:"hidden",boxShadow:isSolved?`0 0 30px ${color}18`:"none",transition:"border-color .4s,box-shadow .4s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:.4}}/>
      <div style={{position:"absolute",left:0,right:0,height:1,animation:"scanline 10s linear infinite 2s",background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:0,pointerEvents:"none"}}/>
      <Corner color={color}/>

      <SectionTag num="02" label="EVERY 3RD WORD PUZZLE" color={color}/>

      <HintBox text='"Patterns repeat more often than you think."' color={color}/>

      {/* Paragraph */}
      <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:6,padding:"16px 18px",marginBottom:14}}>
        <div style={{fontSize:9,letterSpacing:3,color:"var(--dim)",marginBottom:10}}>// PARAGRAPH — FIND THE 3RD WORD IN EACH SENTENCE</div>
        {Q2_SENTENCES.map((s, si) => (
          <p key={si} style={{fontSize:12,lineHeight:2.4,color:"#8899aa",marginBottom:4}}>
            {s.words.map((w, wi) => {
              const isThird = wi === 2;
              const clean = w.replace(".","");
              return (
                <Fragment key={wi}>
                  {wi > 0 && " "}
                  <span style={isThird ? {
                    color,fontWeight:700,fontSize:13,
                    background:`${color}14`,
                    border:`1px solid ${color}44`,
                    borderRadius:3,padding:"0 4px",
                    textShadow:`0 0 10px ${color}`,
                    letterSpacing:1,
                  } : {}}>
                    {wi === 2 ? clean : w}
                  </span>
                  {wi === 2 && <sup style={{color,fontSize:8,marginLeft:1}}>③</sup>}
                </Fragment>
              );
            })}
          </p>
        ))}
      </div>

      {/* Interactive steps */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {/* Step 1: Collected words */}
        <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:4,overflow:"hidden"}}>
          <button onClick={()=>setActiveStep(activeStep===1?0:1)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",color:"var(--text)",fontSize:10,letterSpacing:2}}>
            <span>STEP 1 — COLLECTED 3RD WORDS</span>
            <span style={{color}}>{activeStep===1?"▲":"▼"}</span>
          </button>
          {activeStep===1 && (
            <div style={{padding:"10px 14px",borderTop:"1px solid var(--border)",animation:"countIn .3s ease"}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {Q2_SENTENCES.map((s,i) => (
                  <div key={i} style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                    <span style={{fontSize:9,color:"var(--dim)",letterSpacing:1}}>Sentence {i+1}</span>
                    <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,color,padding:"6px 16px",background:`${color}0f`,border:`1px solid ${color}44`,borderRadius:4,letterSpacing:2}}>{s.third.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: First letters */}
        <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:4,overflow:"hidden"}}>
          <button onClick={()=>setActiveStep(activeStep===2?0:2)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",color:"var(--text)",fontSize:10,letterSpacing:2}}>
            <span>STEP 2 — TAKE FIRST LETTER OF EACH</span>
            <span style={{color}}>{activeStep===2?"▲":"▼"}</span>
          </button>
          {activeStep===2 && (
            <div style={{padding:"10px 14px",borderTop:"1px solid var(--border)",animation:"countIn .3s ease"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                {Q2_COLLECTED.map((w,i) => (
                  <Fragment key={i}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:9,color:"var(--dim)"}}>{w}</span>
                      <div style={{
                        width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
                        background:`${color}15`,border:`1px solid ${color}`,borderRadius:4,
                        fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,color,
                        textShadow:`0 0 12px ${color}`,
                      }}>{w[0]}</div>
                    </div>
                    {i < Q2_COLLECTED.length-1 && <span style={{color:"var(--dimmer)",fontSize:20,alignSelf:"flex-end",marginBottom:4}}>+</span>}
                  </Fragment>
                ))}
                <span style={{color:"var(--dimmer)",fontSize:20,alignSelf:"flex-end",marginBottom:4}}>=</span>
                <div style={{fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:900,color,letterSpacing:6,textShadow:`0 0 16px ${color}`,background:`${color}10`,border:`1px solid ${color}55`,borderRadius:4,padding:"4px 14px"}}>
                  {Q2_PASSKEY}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSolved ? (
        <PassKeyReveal label="PASS KEY 2" passkey={Q2_PASSKEY} color={color}/>
      ) : (
        <>
          <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>
            ENTER THE PASS KEY (first letters of the collected words combined):
          </div>
          <InputRow value={input} onChange={setInput} onSubmit={check} placeholder="Enter pass key..." color={color} error={error}/>
        </>
      )}
    </div>
  );
}

// ─── PUZZLE 3: NUMBER POSITION ─────────────────────────────────────────────────
function Puzzle3({ onSolve, isSolved }) {
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [activePos, setActivePos] = useState(null);
  const color = "#ffb300";

  const check = () => {
    if (input.trim().toUpperCase() === Q3_PASSKEY) {
      onSolve(3, Q3_PASSKEY);
    } else {
      setError(true);
      setTimeout(()=>setError(false), 1500);
    }
  };

  const letters = Q3_WORD.split("");

  return (
    <div style={{background:"var(--s1)",border:`1px solid ${isSolved?color:"var(--border)"}`,borderRadius:8,padding:24,position:"relative",overflow:"hidden",boxShadow:isSolved?`0 0 30px ${color}18`:"none",transition:"border-color .4s,box-shadow .4s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:.4}}/>
      <div style={{position:"absolute",left:0,right:0,height:1,animation:"scanline 9s linear infinite 4s",background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:0,pointerEvents:"none"}}/>
      <Corner color={color}/>

      <SectionTag num="03" label="NUMBER POSITION PUZZLE" color={color}/>

      <HintBox text='"Count carefully. Every position tells a story."' color={color}/>

      {/* The word with interactive positions */}
      <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:6,padding:"16px 18px",marginBottom:14}}>
        <div style={{fontSize:9,letterSpacing:3,color:"var(--dim)",marginBottom:12}}>// THE WORD — HOVER A LETTER TO SEE ITS POSITION</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {letters.map((l,i) => {
            const pos = i+1;
            const isTarget = Q3_POSITIONS.includes(pos);
            const isActive = activePos === pos;
            return (
              <div
                key={i}
                onMouseEnter={()=>setActivePos(pos)}
                onMouseLeave={()=>setActivePos(null)}
                style={{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"default",
                }}
              >
                <div style={{
                  width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
                  background: isActive ? `${color}25` : isTarget ? `${color}10` : "transparent",
                  border: isActive ? `1px solid ${color}` : isTarget ? `1px solid ${color}44` : "1px solid var(--border)",
                  borderRadius:3,
                  fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:700,
                  color: isActive ? color : isTarget ? `${color}cc` : "#4a6080",
                  textShadow: isActive ? `0 0 10px ${color}` : "none",
                  transition:"all .15s ease",
                  animation: isActive ? "letterPop .2s ease" : "none",
                }}>{l}</div>
                <span style={{fontSize:8,color: isActive ? color : "var(--dimmer)",letterSpacing:0}}>{pos}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Position numbers given */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,letterSpacing:2,color:"var(--dim)",marginBottom:10}}>NUMBERS GIVEN — PICK THE LETTER AT EACH POSITION:</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Q3_POSITIONS.map((pos,i) => {
            const letter = Q3_WORD[pos-1];
            return (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,animation:`countIn .3s ease ${i*80}ms both`}}>
                <div style={{
                  background:"var(--bg)",border:"1px solid var(--border2)",
                  borderRadius:4,padding:"4px 10px",
                  fontSize:11,color:"var(--dim)",letterSpacing:1,textAlign:"center",
                  minWidth:36,
                }}>
                  <div style={{fontSize:8,color:"var(--dimmer)",marginBottom:2}}>POS</div>
                  <div style={{color:"var(--text)",fontWeight:700}}>{pos}</div>
                </div>
                <span style={{color:"var(--dimmer)",fontSize:12}}>↓</span>
                <div style={{
                  width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",
                  background:`${color}10`,border:`1px solid ${color}44`,borderRadius:4,
                  fontFamily:"'Orbitron',monospace",fontSize:15,fontWeight:700,
                  color,textShadow:`0 0 10px ${color}`,
                }}>{letter}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div style={{display:"flex",alignItems:"center",gap:10,background:`${color}08`,border:`1px solid ${color}22`,borderRadius:4,padding:"10px 16px",marginBottom:12}}>
        <span style={{fontSize:10,color:"var(--dim)",letterSpacing:2,whiteSpace:"nowrap"}}>HIDDEN WORD:</span>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,color,letterSpacing:5,textShadow:`0 0 16px ${color}`}}>{Q3_ANSWER}</span>
      </div>

      {isSolved ? (
        <PassKeyReveal label="PASS KEY 3" passkey={Q3_PASSKEY} color={color}/>
      ) : (
        <>
          <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>
            ENTER THE PASS KEY (the hidden word you decoded):
          </div>
          <InputRow value={input} onChange={setInput} onSubmit={check} placeholder="Enter pass key..." color={color} error={error}/>
        </>
      )}
    </div>
  );
}

// ─── FINAL KEY SECTION ─────────────────────────────────────────────────────────
function FinalSection({ solvedKeys, onComplete }) {
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [won, setWon]       = useState(false);
  const allSolved = Object.keys(solvedKeys).length === 3;

  const check = () => {
    if (input.trim().toUpperCase() === FINAL_KEY) {
      setWon(true);
      onComplete();
    } else {
      setError(true);
      setTimeout(()=>setError(false), 1500);
    }
  };

  return (
    <div style={{
      background:"var(--s1)",
      border:`1px solid ${allSolved?"var(--gold)":"var(--border2)"}`,
      borderRadius:8,padding:28,
      opacity:allSolved?1:.3,pointerEvents:allSolved?"all":"none",
      transition:"opacity .6s ease,border-color .6s,box-shadow .6s",
      boxShadow:allSolved?"0 0 60px rgba(232,168,56,.08)":"none",
      position:"relative",overflow:"hidden",marginTop:28,
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,var(--gold),transparent)"}}/>
      <Corner color="var(--gold)"/>

      <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:900,color:"var(--gold)",letterSpacing:4,marginBottom:6}}>
        ⬡ COMBINE THE PASS KEYS ⬡
      </div>
      <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2,marginBottom:22}}>
        Apply the extraction rule to each pass key — then combine the letters to form the Final Key.
      </div>

      {/* Rule table */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {FINAL_RULE.map((r,i) => {
          const hasSolved = !!solvedKeys[i+1];
          return (
            <div key={i} style={{display:"grid",gridTemplateColumns:"120px 1fr 80px 60px 50px",gap:10,alignItems:"center",background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:5,padding:"10px 16px",opacity:hasSolved?1:.4,transition:"opacity .4s"}}>
              <span style={{fontSize:9,letterSpacing:2,color:"var(--dim)"}}>{r.label}</span>
              <span style={{fontFamily:"'Orbitron',monospace",fontSize:13,fontWeight:700,color:r.color,letterSpacing:3,textShadow:`0 0 10px ${r.color}`}}>{r.key}</span>
              <span style={{fontSize:9,color:"var(--dim)",textAlign:"center"}}>{r.rule}</span>
              <span style={{color:"var(--dimmer)",textAlign:"center"}}>→</span>
              <div style={{
                width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
                background:`${r.color}12`,border:`1px solid ${r.color}`,borderRadius:4,
                fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,
                color:r.color,textShadow:`0 0 12px ${r.color}`,
                margin:"0 auto",
              }}>{r.letter}</div>
            </div>
          );
        })}
      </div>

      {/* Combine display */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>FINAL KEY =</span>
        {FINAL_RULE.map((r,i) => (
          <Fragment key={i}>
            <div style={{
              width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",
              background:`${r.color}12`,border:`1px solid ${r.color}55`,borderRadius:5,
              fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:900,
              color:r.color,textShadow:`0 0 14px ${r.color}`,
              opacity:solvedKeys[i+1]?1:.2,transition:"opacity .4s",
            }}>{r.letter}</div>
            {i < FINAL_RULE.length-1 && <span style={{color:"var(--dimmer)",fontSize:18}}>+</span>}
          </Fragment>
        ))}
        <span style={{color:"var(--dimmer)",fontSize:18}}>=</span>
        <div style={{
          fontFamily:"'Orbitron',monospace",fontSize:24,fontWeight:900,
          color:"var(--gold)",letterSpacing:6,textShadow:"0 0 20px var(--gold)",
          background:"rgba(232,168,56,.08)",border:"1px solid rgba(232,168,56,.4)",
          borderRadius:5,padding:"6px 18px",
          opacity:allSolved?1:.15,transition:"opacity .4s",
        }}>
          {won ? FINAL_KEY : "???"}
        </div>
      </div>

      {won ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:14,background:"rgba(232,168,56,.07)",border:"1px solid rgba(232,168,56,.3)",borderRadius:6,padding:"14px 20px"}}>
            <span style={{fontSize:20}}>🔓</span>
            <div>
              <div style={{fontSize:10,letterSpacing:3,color:"var(--dim)",marginBottom:4}}>FINAL KEY ACCEPTED — NEXT ROUND UNLOCKED</div>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,color:"var(--gold)",letterSpacing:4,textShadow:"0 0 16px var(--gold)"}}>
                {FINAL_KEY}
              </div>
            </div>
          </div>
          <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>
            🔐 Round token stored in <code style={{color:"var(--gold)"}}>localStorage.getItem('round_next_token')</code>
          </div>
        </div>
      ) : (
        <>
          <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2}}>
            ENTER THE FINAL KEY (3-letter combination from the rule above):
          </div>
          <InputRow value={input} onChange={setInput} onSubmit={check} placeholder="Enter final key..." color="var(--gold)" error={error}/>
        </>
      )}
    </div>
  );
}

// ─── ACCESS GATE ───────────────────────────────────────────────────────────────
function AccessGate({ onAuth }) {
  const [val, setVal]   = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (VALID_TOKENS.map(t=>t.toUpperCase()).includes(val.trim().toUpperCase())) {
      onAuth();
    } else {
      setError(true); setShake(true);
      setTimeout(()=>{ setError(false); setShake(false); }, 1500);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .6s ease"}}>
      <p style={{fontSize:10,letterSpacing:6,color:"var(--dim)",marginBottom:14,textAlign:"center"}}>◈ VIRTUAL TREASURE HUNT · ROUND 3 ◈</p>

      <h1 style={{fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:"clamp(24px,5.5vw,58px)",letterSpacing:7,color:"var(--amber)",textShadow:"0 0 40px rgba(255,179,0,.5),0 0 80px rgba(255,179,0,.15)",textAlign:"center",marginBottom:8,position:"relative"}}>
        HIDDEN MESSAGE
        <span style={{position:"absolute",inset:0,color:"#ff3d5a",animation:"glitch 5s infinite",pointerEvents:"none"}} aria-hidden>HIDDEN MESSAGE</span>
      </h1>
      <p style={{fontSize:11,color:"var(--dim)",letterSpacing:3,textAlign:"center",marginBottom:40}}>CRYPTOGRAPHIC ANALYSIS PROTOCOL · ACCESS REQUIRED</p>

      <div style={{background:"var(--s1)",border:"1px solid var(--border2)",borderRadius:8,padding:"36px 40px",width:"100%",maxWidth:500,position:"relative",animation:shake?"shake .5s ease":"none"}}>
        <Corner color="var(--amber)"/>
        {/* Log */}
        <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:4,padding:14,marginBottom:20,fontSize:10,lineHeight:2,maxHeight:110,overflow:"hidden"}}>
          {[
            {t:"[!] ENCRYPTED MESSAGES DETECTED IN SYSTEM",c:"var(--red)"},
            {t:"[*] 3 cipher layers identified across documents",c:"var(--amber)"},
            {t:"[*] Combine recovered pass keys to unlock the vault",c:"var(--amber)"},
            {t:"[+] Awaiting agent credentials from Round 2...",c:"var(--green)"},
          ].map((l,i)=><span key={i} style={{display:"block",color:l.c}}>{l.t}</span>)}
        </div>
        <p style={{fontSize:10,letterSpacing:3,color:"var(--dim)",marginBottom:10}}>// ENTER ROUND 2 FINAL KEY</p>
        <input
          value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()}
          placeholder="LEE or VAULT_OMEGA_PRIME"
          autoComplete="off" spellCheck={false}
          style={{width:"100%",background:"var(--bg)",border:`1px solid ${error?"var(--red)":"var(--border2)"}`,borderRadius:4,padding:"13px 16px",color:"var(--amber)",fontFamily:"'Share Tech Mono',monospace",fontSize:14,letterSpacing:2,outline:"none",marginBottom:13,transition:"border-color .2s"}}
        />
        <button onClick={attempt} style={{width:"100%",background:"transparent",border:"1px solid var(--amber)",borderRadius:4,padding:13,color:"var(--amber)",fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:700,letterSpacing:4,cursor:"pointer",position:"relative",overflow:"hidden"}}>
          AUTHENTICATE &nbsp;▶
          <span style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,179,0,.08),transparent)",transform:"translateX(-100%)",animation:"shimmer 2.5s infinite"}}/>
        </button>
        {error && <p style={{fontSize:11,color:"var(--red)",marginTop:10,textAlign:"center",letterSpacing:1,animation:"fadeUp .2s ease"}}>✗ INVALID TOKEN — Complete Round 2 first</p>}
        <p style={{marginTop:18,fontSize:10,color:"var(--dim)",textAlign:"center",lineHeight:1.9}}>Enter the Final Key from Round 2: <span style={{color:"var(--amber)"}}>LEE</span><br/>Or the Round 2 token: <span style={{color:"var(--amber)"}}>VAULT_OMEGA_PRIME</span></p>
      </div>
    </div>
  );
}

// ─── WIN OVERLAY ───────────────────────────────────────────────────────────────
function WinOverlay({ onClose }) {
  useEffect(() => {
    try {
      localStorage.setItem("round_next_token", ROUND_NEXT_TOKEN);
      localStorage.setItem("round3_status", "CLEARED");
    } catch(e) {}
    window.__nextRound__ = { token: ROUND_NEXT_TOKEN, cleared: true };
    console.clear();
    console.log("%c╔══════════════════════════════════════════════╗","color:#ffb300;font-size:13px;");
    console.log("%c║   🏆  HIDDEN MESSAGE ROUND — CLEARED          ║","color:#ffb300;font-size:13px;font-weight:bold;");
    console.log("%c╚══════════════════════════════════════════════╝","color:#ffb300;font-size:13px;");
    console.log("%c\nFinal Key was: LEE","color:#00ff9f;font-size:13px;");
    console.log(`%cNext Round Token: ${ROUND_NEXT_TOKEN}`,"color:#fff;background:#060c18;font-size:18px;font-weight:bold;padding:8px 20px;border-left:4px solid #ffb300;display:block;");
  }, []);

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,padding:24,textAlign:"center",animation:"fadeUp .6s ease"}}>
      <div style={{fontSize:58,color:"var(--gold)",textShadow:"0 0 40px var(--gold)",animation:"spin 6s linear infinite"}}>★</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:"clamp(20px,5vw,44px)",fontWeight:900,color:"var(--gold)",letterSpacing:6,textShadow:"0 0 40px var(--gold)"}}>CHALLENGE CLEARED</div>
      <div style={{fontSize:12,color:"var(--text)",opacity:.75,letterSpacing:1,maxWidth:480,lineHeight:1.9}}>
        Outstanding work. All three cipher layers of the <strong>Hidden Message Challenge</strong> have been decoded. The final key <strong style={{color:"var(--gold)"}}>LEE</strong> was successfully reconstructed.
      </div>
      <div style={{background:"var(--s1)",border:"1px solid var(--gold)",borderRadius:6,padding:"14px 30px",fontSize:15,color:"var(--gold)",letterSpacing:3,boxShadow:"0 0 30px rgba(232,168,56,.15)"}}>
        NEXT ROUND TOKEN: {ROUND_NEXT_TOKEN}
      </div>
      <div style={{fontSize:11,color:"var(--cyan)",letterSpacing:2}}>▶ Token also stored in Console &amp; localStorage</div>
      <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--dim)",borderRadius:4,padding:"10px 24px",color:"var(--dim)",fontFamily:"'Share Tech Mono',monospace",fontSize:12,cursor:"pointer",letterSpacing:2,marginTop:6}}>
        CONTINUE →
      </button>
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────────
export default function HiddenMessage() {
  useEffect(() => { injectStyles(); }, []);

  const [authed, setAuthed]       = useState(false);
  const [solvedKeys, setSolvedKeys] = useState({});   // { 1: "LOGICAL", 2: "WEP", 3: "TREASURE" }
  const [won, setWon]             = useState(false);

  const handleSolve = (puzzleNum, key) => {
    setSolvedKeys(prev => ({ ...prev, [puzzleNum]: key }));
  };

  const solvedCount = Object.keys(solvedKeys).length;

  if (!authed) return (
    <div style={{position:"relative",zIndex:1}}>
      <GridBg/>
      <AccessGate onAuth={()=>setAuthed(true)}/>
    </div>
  );

  return (
    <div style={{position:"relative",zIndex:1,minHeight:"100vh"}}>
      <GridBg/>

      {/* Top bar */}
      <div style={{position:"sticky",top:0,zIndex:500,background:"rgba(2,5,8,.93)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border2)",padding:"12px 24px",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:13,fontWeight:900,color:"var(--amber)",letterSpacing:3}}>HIDDEN MESSAGE</span>
        <div style={{width:1,height:24,background:"var(--border2)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:140}}>
          <div style={{flex:1,height:3,background:"var(--dimmer)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(solvedCount/3)*100}%`,background:"linear-gradient(90deg,var(--cyan),var(--amber))",transition:"width .5s ease",borderRadius:2}}/>
          </div>
          <span style={{fontSize:11,color:"var(--dim)",whiteSpace:"nowrap"}}>{solvedCount} / 3 SOLVED</span>
        </div>
        <div style={{width:1,height:24,background:"var(--border2)"}}/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[1,2,3].map(n => (
            <div key={n} style={{fontSize:9,letterSpacing:2,padding:"4px 10px",borderRadius:3,border:`1px solid ${solvedKeys[n]?"var(--green)":"var(--border2)"}`,color:solvedKeys[n]?"var(--green)":"var(--dim)",background:solvedKeys[n]?"rgba(0,255,159,.06)":"transparent",transition:"all .4s"}}>
              {solvedKeys[n] ? `✓ P${n}: ${solvedKeys[n]}` : `PUZZLE ${n}`}
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"28px 20px 80px",maxWidth:1000,margin:"0 auto"}}>
        {/* Briefing */}
        <div style={{background:"var(--s1)",border:"1px solid var(--border2)",borderLeft:"3px solid var(--amber)",borderRadius:6,padding:"22px 26px",marginBottom:28,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,var(--amber),transparent)"}}/>
          <div style={{fontSize:9,letterSpacing:5,color:"var(--dim)",marginBottom:10}}>// MISSION BRIEFING — HIDDEN MESSAGE PROTOCOL</div>
          <div style={{fontSize:12,lineHeight:2,color:"var(--text)",opacity:.85}}>
            Agent, three encrypted documents have been recovered from the breach. Each one hides a <strong style={{color:"var(--amber)"}}>pass key</strong> using a different cipher technique — highlighted letters, word patterns, and position codes.<br/>
            Decode all three, then apply the <strong style={{color:"var(--amber)"}}>Final Key Rule</strong> to assemble the master unlock code.
          </div>
          <div style={{marginTop:14,display:"flex",gap:12,flexWrap:"wrap"}}>
            {[["◈ 3 CIPHER LAYERS","var(--amber)"],["✓ AGENT CLEARED","var(--green)"],[`◈ ${solvedCount}/3 KEYS RECOVERED`,solvedCount===3?"var(--gold)":"var(--dim)"]].map(([t,c])=>(
              <span key={t} style={{fontSize:10,padding:"4px 12px",borderRadius:3,letterSpacing:2,border:`1px solid ${c}`,color:c,background:`${c}0d`}}>{t}</span>
            ))}
          </div>
        </div>

        {/* Three puzzles */}
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <Puzzle1 onSolve={handleSolve} isSolved={!!solvedKeys[1]}/>
          <Puzzle2 onSolve={handleSolve} isSolved={!!solvedKeys[2]}/>
          <Puzzle3 onSolve={handleSolve} isSolved={!!solvedKeys[3]}/>
        </div>

        {/* Final section */}
        <FinalSection solvedKeys={solvedKeys} onComplete={()=>setWon(true)}/>
      </div>

      {won && <WinOverlay onClose={()=>setWon(false)}/>}
    </div>
  );
}
