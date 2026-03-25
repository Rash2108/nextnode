import { useState, useEffect } from "react";

// ─── PUZZLE DATA ───────────────────────────────────────────────────────────────
// Participants visit a real GFG/external page, find the described snippet,
// run it in the GFG IDE or their own compiler, and enter the exact output.

// const HINTS = [
//   {
//     id: "A",
//     label: "ALPHA",
//     color: "#00ff9f",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/python-list/",
//     pageHint: "Visit the GFG article on Python Lists.",
//     taskLine1: "On that page, find the very first code example.",
//     taskLine2: 'Look for the snippet that creates a list called "thislist" with items: "apple", "banana", "cherry".',
//     taskLine3: 'Run it in the GFG IDE (▶ button). What is the second element printed?',
//     answer: "BANANA",
//     confirmHint: "Lists are zero-indexed. The second element is at index [1].",
//   },
//   {
//     id: "B",
//     label: "BETA",
//     color: "#00cfff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/arrays-in-java/",
//     pageHint: "Visit the GFG article on Arrays in Java.",
//     taskLine1: "Find the section titled 'Getting the Length of an Array'.",
//     taskLine2: "Run the code example in that section using the GFG IDE.",
//     taskLine3: "What number does it print as the length of the array?",
//     answer: "5",
//     confirmHint: "Count the elements in the array declared in that snippet.",
//   },
//   {
//     id: "C",
//     label: "GAMMA",
//     color: "#ff6b35",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/python-dictionary/",
//     pageHint: "Visit the GFG article on Python Dictionaries.",
//     taskLine1: "Find the first code snippet on the page that creates a dictionary.",
//     taskLine2: 'It has keys like "brand", "model", "year". Run it in the GFG IDE.',
//     taskLine3: "What is the value printed for the 'brand' key?",
//     answer: "FORD",
//     confirmHint: "Print the value by accessing dict['brand'] — it's a car brand.",
//   },
//   {
//     id: "D",
//     label: "DELTA",
//     color: "#ff3cac",
//     language: "JavaScript",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/javascript-array-reverse-method/",
//     pageHint: "Visit the GFG article on JavaScript Array reverse() method.",
//     taskLine1: "Find the first working example on the page.",
//     taskLine2: "Run it using the GFG IDE. It reverses an array of numbers.",
//     taskLine3: "What is the FIRST element of the reversed array that gets printed?",
//     answer: "5",
//     confirmHint: "Reverse [1,2,3,4,5] — what comes first after reversal?",
//   },
//   {
//     id: "E",
//     label: "EPSILON",
//     color: "#ffe600",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/stack-in-python/",
//     pageHint: "Visit the GFG article on Stack in Python.",
//     taskLine1: "Find the section that implements a stack using a Python list.",
//     taskLine2: "Run the pop() example snippet in the GFG IDE.",
//     taskLine3: "What is the element that gets popped and printed last?",
//     answer: "3",
//     confirmHint: "LIFO — the last element pushed is the first to be popped.",
//   },
//   {
//     id: "F",
//     label: "ZETA",
//     color: "#b44fff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/string-length-in-java/",
//     pageHint: "Visit the GFG article on String length() in Java.",
//     taskLine1: "Find the first code example on the page.",
//     taskLine2: "Run it in the GFG IDE. It calculates the length of a string.",
//     taskLine3: "What number is printed as the output?",
//     answer: "13",
//     confirmHint: "Count the characters in the string used in the example.",
//   },
//   {
//     id: "G",
//     label: "ETA",
//     color: "#00e5ff",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/python-string-upper/",
//     pageHint: "Visit the GFG article on Python String upper() method.",
//     taskLine1: "Find the example that calls .upper() on a string.",
//     taskLine2: "Run it in the GFG IDE.",
//     taskLine3: "What is the exact string printed as output?",
//     answer: "PYTHON IS FUN",
//     confirmHint: "The original string is 'PyThoN is FuN' — upper() it.",
//   },
//   {
//     id: "H",
//     label: "THETA",
//     color: "#ff4f4f",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/java-math-abs-method-examples/",
//     pageHint: "Visit the GFG article on Java Math.abs() method.",
//     taskLine1: "Find the first code example that uses Math.abs() on a negative number.",
//     taskLine2: "Run it in the GFG IDE.",
//     taskLine3: "What positive number is printed as the output?",
//     answer: "5",
//     confirmHint: "The absolute value of a negative integer — drops the minus sign.",
//   },
// ];

// const HINTS = [
//   {
//     id: "A",
//     label: "ALPHA",
//     color: "#00ff9f",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Python lesson about lists hides ALPHA's clue.",
//     taskLine1: "ALPHA uncovered a short Python snippet built around a small collection of fruit.",
//     taskLine2: "Near the beginning of the lesson, one example reveals a single item drawn from that collection.",
//     taskLine3: "Recover the value ALPHA is searching for.",
//     answer: "BANANA",
//     confirmHint: "The clue is neither the first nor the last item in the example list.",
//   },
//   {
//     id: "B",
//     label: "BETA",
//     color: "#00cfff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Java lesson about arrays hides BETA's clue.",
//     taskLine1: "BETA traced a Java snippet that examines how much an array is holding.",
//     taskLine2: "Somewhere in the lesson, a compact example reveals a number tied to the array itself.",
//     taskLine3: "Recover the value BETA is searching for.",
//     answer: "5",
//     confirmHint: "The answer matches the full count of values stored in the sample array.",
//   },
//   {
//     id: "C",
//     label: "GAMMA",
//     color: "#ff6b35",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Python lesson about dictionaries hides GAMMA's clue.",
//     taskLine1: "GAMMA uncovered a short Python snippet centered on a dictionary describing something familiar.",
//     taskLine2: "One of the earliest examples in the lesson reveals a value tied to a well-known automobile maker.",
//     taskLine3: "Recover the value GAMMA is searching for.",
//     answer: "FORD",
//     confirmHint: "Look for the entry connected to the maker rather than the model or year.",
//   },
//   {
//     id: "D",
//     label: "DELTA",
//     color: "#ff3cac",
//     language: "JavaScript",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a JavaScript lesson about reversing arrays hides DELTA's clue.",
//     taskLine1: "DELTA found a JavaScript snippet where a line of numbers is turned back on itself.",
//     taskLine2: "An early example in the lesson reveals which value takes the lead after the reversal.",
//     taskLine3: "Recover the value DELTA is searching for.",
//     answer: "5",
//     confirmHint: "The clue comes from whatever moves to the front once the original order is inverted.",
//   },
//   {
//     id: "E",
//     label: "EPSILON",
//     color: "#ffe600",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Python lesson about stacks hides EPSILON's clue.",
//     taskLine1: "EPSILON tracked a Python example where items are piled up and then removed.",
//     taskLine2: "Within the lesson, one snippet reveals a value at the key moment the structure gives something back.",
//     taskLine3: "Recover the value EPSILON is searching for.",
//     answer: "3",
//     confirmHint: "Think about which item was placed most recently before anything is taken away.",
//   },
//   {
//     id: "F",
//     label: "ZETA",
//     color: "#b44fff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Java lesson about measuring text hides ZETA's clue.",
//     taskLine1: "ZETA uncovered a short Java snippet that investigates a piece of text.",
//     taskLine2: "One of the earliest examples in the lesson reveals a number tied directly to that text.",
//     taskLine3: "Recover the value ZETA is searching for.",
//     answer: "13",
//     confirmHint: "The clue is the total character count of the exact sample text used there.",
//   },
//   {
//     id: "G",
//     label: "ETA",
//     color: "#00e5ff",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Python lesson about changing text to uppercase hides ETA's clue.",
//     taskLine1: "ETA uncovered a short Python snippet where a message changes form without changing its words.",
//     taskLine2: "Somewhere in the lesson, one example reveals what that message becomes after the transformation.",
//     taskLine3: "Recover the value ETA is searching for.",
//     answer: "PYTHON IS FUN",
//     confirmHint: "The words stay the same, but every letter ends up in the same stronger form.",
//   },
//   {
//     id: "H",
//     label: "THETA",
//     color: "#ff4f4f",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere on GeeksforGeeks, a Java Math lesson about absolute value hides THETA's clue.",
//     taskLine1: "THETA discovered a short Java snippet where a number crosses from negative into neutral territory.",
//     taskLine2: "An early example in the lesson reveals the positive value that remains after the shift.",
//     taskLine3: "Recover the value THETA is searching for.",
//     answer: "5",
//     confirmHint: "The clue is what remains when distance from zero matters more than direction.",
//   },
// ];

// const HINTS = [
//   {
//     id: "A",
//     label: "ALPHA",
//     color: "#00ff9f",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Python scroll about lists hides ALPHA's next rune.",
//     taskLine1: "ALPHA stepped into a humble training chamber where a small circle of fruits had been arranged like relics for a beginner's trial.",
//     taskLine2: "Near the opening of that scroll, one technique calls forth a single relic from the collection, revealing the item chosen by fate.",
//     taskLine3: "Recover ALPHA's hidden rune.",
//     answer: "BANANA",
//     confirmHint: "The rune is guarded between the first fruit and the last.",
//   },
//   {
//     id: "B",
//     label: "BETA",
//     color: "#00cfff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Java scroll about arrays hides BETA's next rune.",
//     taskLine1: "BETA entered a forge of numbered shards, where a sealed array held its strength in silent formation.",
//     taskLine2: "Within that scroll, a compact technique reveals the true size of the formation, as though counting the warriors standing in rank.",
//     taskLine3: "Recover BETA's hidden rune.",
//     answer: "5",
//     confirmHint: "The rune is equal to the full number of values standing inside the array.",
//   },
//   {
//     id: "C",
//     label: "GAMMA",
//     color: "#ff6b35",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Python scroll about dictionaries hides GAMMA's next rune.",
//     taskLine1: "GAMMA uncovered a coded ledger, a dictionary of marks and names bound to a familiar machine from the outer world.",
//     taskLine2: "Early in the scroll, one revealed entry points not to the model or the year, but to the maker whose crest the machine bears.",
//     taskLine3: "Recover GAMMA's hidden rune.",
//     answer: "FORD",
//     confirmHint: "Seek the name of the creator, not the title of the machine.",
//   },
//   {
//     id: "D",
//     label: "DELTA",
//     color: "#ff3cac",
//     language: "JavaScript",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a JavaScript scroll about reversing arrays hides DELTA's next rune.",
//     taskLine1: "DELTA found a line of numbered spirits marching in order, until a reversal technique turned their formation upon itself.",
//     taskLine2: "When the sequence flips, a new leader takes the front like the strongest fighter stepping out from the rear guard.",
//     taskLine3: "Recover DELTA's hidden rune.",
//     answer: "5",
//     confirmHint: "The rune belongs to the value that rises to the front after the reversal is complete.",
//   },
//   {
//     id: "E",
//     label: "EPSILON",
//     color: "#ffe600",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Python scroll about stacks hides EPSILON's next rune.",
//     taskLine1: "EPSILON entered a tower of stacked seals, where each new mark was placed atop the last like layers in a trial dungeon.",
//     taskLine2: "In one of the scroll's rites, the structure yields a value back to the surface, revealing which seal departs first when the trial begins.",
//     taskLine3: "Recover EPSILON's hidden rune.",
//     answer: "3",
//     confirmHint: "In this tower, the newest seal is the first one to leave.",
//   },
//   {
//     id: "F",
//     label: "ZETA",
//     color: "#b44fff",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Java scroll about measuring text hides ZETA's next rune.",
//     taskLine1: "ZETA uncovered a fragment of text inscribed within a Java spell, its true size concealed behind plain sight.",
//     taskLine2: "Near the beginning of the scroll, one technique measures the fragment directly, exposing the number bound to its form.",
//     taskLine3: "Recover ZETA's hidden rune.",
//     answer: "13",
//     confirmHint: "Count every symbol carried by the exact sample text.",
//   },
//   {
//     id: "G",
//     label: "ETA",
//     color: "#00e5ff",
//     language: "Python",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Python scroll about transforming text to uppercase hides ETA's next rune.",
//     taskLine1: "ETA found a message written in unstable lettering, its power split between lower and upper forms like an unfinished incantation.",
//     taskLine2: "One technique in the scroll reforges that message into a single dominant form, letting every letter rise in full strength.",
//     taskLine3: "Recover ETA's hidden rune.",
//     answer: "PYTHON IS FUN",
//     confirmHint: "The words do not change, only the form of every letter does.",
//   },
//   {
//     id: "H",
//     label: "THETA",
//     color: "#ff4f4f",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Java scroll about absolute value hides THETA's next rune.",
//     taskLine1: "THETA encountered a negative number wrapped in shadow, marked by a sign that concealed its pure magnitude.",
//     taskLine2: "Within the scroll, a Math technique strips away that shadow, leaving only the number's true distance from zero.",
//     taskLine3: "Recover THETA's hidden rune.",
//     answer: "5",
//     confirmHint: "Ignore direction. What remains is only magnitude.",
//   },
//   {
//     id: "I",
//     label: "IOTA",
//     color: "#7dff7a",
//     language: "Java",
//     site: "GeeksforGeeks",
//     siteUrl: "https://www.geeksforgeeks.org/",
//     pageHint: "Somewhere in the GeeksforGeeks archives, a Java scroll about methods hides IOTA's next rune.",
//     taskLine1: "IOTA stepped into a sequence of chained techniques, where each move summoned the next like a hunter pressing deeper into a raid.",
//     taskLine2: "When the chain resolves and the dust settles, one final message remains on the screen like the last echo of battle.",
//     taskLine3: "Recover IOTA's final rune.",
//     answer: "In Method D",
//     confirmHint: "The final rune appears only after the earlier chain has completely ended.",
//   },
// ];

const HINTS = [
  {
    id: "A",
    label: "ALPHA",
    color: "#00ff9f",
    language: "Python",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Python lesson about lists hides ALPHA's clue.",
    taskLine1: "ALPHA found a Python example built around a short list of fruits.",
    taskLine2: "Near the start of the lesson, one snippet pulls a single item from that list like selecting the next target.",
    taskLine3: "Recover ALPHA's clue.",
    answer: "BANANA",
    confirmHint: "The answer is the middle fruit in that three-item list.",
  },
  {
    id: "B",
    label: "BETA",
    color: "#00cfff",
    language: "Java",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Java lesson about arrays hides BETA's clue.",
    taskLine1: "BETA tracked a Java example that checks how many values an array is carrying.",
    taskLine2: "In that lesson, one snippet reveals the array's size like a system reading its total load.",
    taskLine3: "Recover BETA's clue.",
    answer: "5",
    confirmHint: "Count every value stored in the sample array.",
  },
  {
    id: "C",
    label: "GAMMA",
    color: "#ff6b35",
    language: "Python",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Python lesson about dictionaries hides GAMMA's clue.",
    taskLine1: "GAMMA found a Python example that stores details inside a dictionary.",
    taskLine2: "One of the early snippets reveals the value linked to the maker of the car, not its model or year.",
    taskLine3: "Recover GAMMA's clue.",
    answer: "FORD",
    confirmHint: "Focus on the car brand entry.",
  },
  {
    id: "D",
    label: "DELTA",
    color: "#ff3cac",
    language: "JavaScript",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a JavaScript lesson about reversing arrays hides DELTA's clue.",
    taskLine1: "DELTA found a JavaScript example where a number sequence gets flipped.",
    taskLine2: "After the reversal, one value takes the front position like the lead fighter stepping forward.",
    taskLine3: "Recover DELTA's clue.",
    answer: "5",
    confirmHint: "Think about which number ends up first after reversing the array.",
  },
  {
    id: "E",
    label: "EPSILON",
    color: "#ffe600",
    language: "Python",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Python lesson about stacks hides EPSILON's clue.",
    taskLine1: "EPSILON found a Python example where values are stacked and then removed in order.",
    taskLine2: "One snippet shows which value leaves first when the stack starts giving items back.",
    taskLine3: "Recover EPSILON's clue.",
    answer: "3",
    confirmHint: "The most recently added value leaves first.",
  },
  {
    id: "F",
    label: "ZETA",
    color: "#b44fff",
    language: "Java",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Java lesson about measuring text hides ZETA's clue.",
    taskLine1: "ZETA found a Java example focused on the size of a string.",
    taskLine2: "Near the beginning of the lesson, one snippet reveals the number tied directly to that text.",
    taskLine3: "Recover ZETA's clue.",
    answer: "13",
    confirmHint: "Count the characters in the sample string.",
  },
  {
    id: "G",
    label: "ETA",
    color: "#00e5ff",
    language: "Python",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Python lesson about uppercase text hides ETA's clue.",
    taskLine1: "ETA found a Python example where a mixed-case message gets transformed.",
    taskLine2: "One snippet shows the message after every letter powers up into uppercase form.",
    taskLine3: "Recover ETA's clue.",
    answer: "PYTHON IS FUN",
    confirmHint: "The words stay the same, only the letter case changes.",
  },
  {
    id: "H",
    label: "THETA",
    color: "#ff4f4f",
    language: "Java",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Java Math lesson about absolute value hides THETA's clue.",
    taskLine1: "THETA found a Java example where a negative number loses its minus sign.",
    taskLine2: "In that snippet, the final output reveals the number's pure magnitude.",
    taskLine3: "Recover THETA's clue.",
    answer: "5",
    confirmHint: "Absolute value keeps the distance from zero, not the sign.",
  },
  {
    id: "I",
    label: "IOTA",
    color: "#7dff7a",
    language: "Java",
    site: "GeeksforGeeks",
    siteUrl: "https://www.geeksforgeeks.org/",
    pageHint: "Somewhere on GeeksforGeeks, a Java lesson about methods hides IOTA's clue.",
    taskLine1: "IOTA found a Java example where methods call each other in sequence.",
    taskLine2: "After that chain finishes, one final message appears like the last signal on the screen.",
    taskLine3: "Recover IOTA's clue.",
    answer: "In Method D",
    confirmHint: "The answer is the final printed line, after the earlier method chain ends.",
  },
];

// Master key = first char of each answer A→H
// BANANA→B, 5→5, FORD→F, 5→5, 3→3, 13→1, GEEKSFORGEEKS→G, 5→5
const FINAL_PASSWORD = "B5F5313G5";
// Actually let's use a simpler approach: just first char of each
// B 5 F 5 3 1 G 5  → "B5F531G5"
const MASTER_KEY = "B5F531G5";
const SECRET_FLAG = "CTF{g33ks_hunt3r_m4st3r_2024}";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── HINT CELL ────────────────────────────────────────────────────────────────
function HintCell({ hint, isUnlocked, onSubmit, solvedAnswer }) {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [flashOk, setFlashOk] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const c = hint.color;

  const handleSubmit = () => {
    if (input.trim().toUpperCase() === hint.answer.toUpperCase()) {
      setFlashOk(true);
      onSubmit(hint.id, hint.answer);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{
      position: "relative",
      background: flashOk ? `${c}0a` : "#080d14",
      border: `1px solid ${isUnlocked ? c : "#162030"}`,
      borderRadius: 8,
      padding: "18px 18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 11,
      overflow: "hidden",
      transition: "border-color 0.3s, box-shadow 0.3s",
      boxShadow: isUnlocked ? `0 0 22px ${c}18` : "none",
      animation: shake ? "shake 0.5s ease" : "none",
      minHeight: 300,
    }}>
      {/* Corner brackets */}
      {[
        { top: 6, left: 6, borderWidth: "1px 0 0 1px" },
        { top: 6, right: 6, borderWidth: "1px 1px 0 0" },
        { bottom: 6, left: 6, borderWidth: "0 0 1px 1px" },
        { bottom: 6, right: 6, borderWidth: "0 1px 1px 0" },
      ].map((s, i) => (
        <span key={i} style={{ position: "absolute", width: 10, height: 10, borderColor: `${c}77`, borderStyle: "solid", ...s }} />
      ))}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 700,
            letterSpacing: 2, color: c,
          }}>
            CLUE :: {hint.label}
          </span>
        </div>
        <span style={{
          fontSize: 9, letterSpacing: 1, padding: "2px 8px",
          border: `1px solid ${c}55`, borderRadius: 2, color: c, opacity: 0.85,
        }}>
          {hint.language}
        </span>
      </div>

      {isUnlocked ? (
        /* ── SOLVED STATE ── */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 34, color: c, textShadow: `0 0 20px ${c}` }}>✓</div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 700,
            letterSpacing: 4, color: c, textShadow: `0 0 16px ${c}`,
            textAlign: "center", wordBreak: "break-word",
          }}>
            {solvedAnswer}
          </div>
          <a href={hint.siteUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: "#3a5070", letterSpacing: 1, textDecoration: "none", borderBottom: "1px dashed #3a5070" }}>
            {hint.site}
          </a>
        </div>
      ) : (
        <>
          {/* ── MISSION CARD ── */}
          <div style={{
            background: "#030912",
            border: `1px solid ${c}22`,
            borderRadius: 5,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            {/* Step 1 — Go to site */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                background: `${c}22`, color: c, fontFamily: "'Orbitron', monospace",
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                flexShrink: 0, marginTop: 1,
              }}>01</span>
              <div>
                <div style={{ fontSize: 11, color: "#b8cce0cc", lineHeight: 1.6 }}>
                  {hint.pageHint}
                </div>
                <a href={hint.siteUrl} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: 10, color: c, textDecoration: "none",
                  borderBottom: `1px dashed ${c}66`, display: "inline-block", marginTop: 4,
                  wordBreak: "break-all",
                }}>
                  🌐 {hint.siteUrl.replace("https://", "")}
                </a>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${c}18`, margin: "2px 0" }} />

            {/* Step 2 — What to find */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                background: `${c}22`, color: c, fontFamily: "'Orbitron', monospace",
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                flexShrink: 0, marginTop: 1,
              }}>02</span>
              <div style={{ fontSize: 11, color: "#b8cce0cc", lineHeight: 1.6 }}>
                {hint.taskLine1}
                {hint.taskLine2 && <><br />{hint.taskLine2}</>}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${c}18`, margin: "2px 0" }} />

            {/* Step 3 — The question */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                background: `${c}33`, color: c, fontFamily: "'Orbitron', monospace",
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                flexShrink: 0, marginTop: 1,
              }}>❓</span>
              <div style={{ fontSize: 12, color: "#e0eeff", lineHeight: 1.6, fontWeight: 600 }}>
                {hint.taskLine3}
              </div>
            </div>
          </div>

          {/* Hint toggle */}
          <div
            onClick={() => setShowConfirm(v => !v)}
            style={{ display: "flex", gap: 7, fontSize: 10, color: "#3a5070", alignItems: "center", cursor: "pointer", userSelect: "none" }}
          >
            <span style={{ fontSize: 12 }}>💡</span>
            <span style={{ borderBottom: "1px dashed #3a5070" }}>
              {showConfirm ? "Hide hint" : "Stuck? Click for a hint"}
            </span>
          </div>
          {showConfirm && (
            <div style={{
              fontSize: 10, color: `${c}cc`, background: `${c}0d`,
              border: `1px solid ${c}33`, borderRadius: 4, padding: "8px 12px", lineHeight: 1.7,
            }}>
              {hint.confirmHint}
            </div>
          )}

          {/* Input */}
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <input
              style={{
                flex: 1, background: "transparent", border: `1px solid ${c}55`,
                borderRadius: 4, padding: "9px 12px", color: "#e0eeff",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none",
                letterSpacing: 2, textTransform: "uppercase",
              }}
              placeholder="Enter output here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button onClick={handleSubmit} style={{
              background: `${c}11`, border: `1px solid ${c}55`,
              borderRadius: 4, color: c, width: 44, cursor: "pointer", fontSize: 16,
              transition: "background 0.2s",
            }}>▶</button>
          </div>
        </>
      )}

      {/* Animated scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg,transparent,${c},transparent)`,
        animation: "scan 6s infinite", pointerEvents: "none", opacity: 0,
      }} />
    </div>
  );
}

// ─── CENTER CELL ──────────────────────────────────────────────────────────────
function CenterCell({ allSolved, onFinalSubmit, isSolved }) {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [win, setWin] = useState(isSolved);
  const gold = "#e8a838";

  const handleSubmit = () => {
    if (input.trim().toUpperCase() === MASTER_KEY) {
      setWin(true);
      onFinalSubmit();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  useEffect(() => { if (isSolved) setWin(true); }, [isSolved]);

  return (
    <div style={{
      position: "relative",
      background: "#030810",
      border: `1px solid ${win ? gold : allSolved ? gold : "#1a2535"}`,
      borderRadius: 8,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 12,
      overflow: "hidden",
      boxShadow: win
        ? `0 0 80px ${gold}44, 0 0 160px ${gold}16`
        : allSolved ? `0 0 40px ${gold}20` : "none",
      animation: shake ? "shake 0.5s ease" : "none",
      minHeight: 300,
    }}>
      {/* Gold corners */}
      {[
        { top: 6, left: 6, borderWidth: "1px 0 0 1px" },
        { top: 6, right: 6, borderWidth: "1px 1px 0 0" },
        { bottom: 6, left: 6, borderWidth: "0 0 1px 1px" },
        { bottom: 6, right: 6, borderWidth: "0 1px 1px 0" },
      ].map((s, i) => (
        <span key={i} style={{ position: "absolute", width: 12, height: 12, borderColor: gold, borderStyle: "solid", ...s }} />
      ))}

      {win ? (
        <>
          <div style={{ fontSize: 42, color: gold, textShadow: `0 0 30px ${gold}`, animation: "spin 5s linear infinite" }}>★</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 900, letterSpacing: 4, color: gold, textShadow: `0 0 20px ${gold}` }}>
            VAULT OPEN
          </div>
          <div style={{ fontSize: 11, color: "#b8cce0aa", lineHeight: 1.7 }}>
            Your flag is waiting in the<br />browser DevTools Console
          </div>
          <div style={{
            fontSize: 12, color: "#00ff9f",
            padding: "7px 16px", border: "1px solid #00ff9f33",
            borderRadius: 4, background: "#00ff9f0a", letterSpacing: 1,
          }}>
            <span style={{ animation: "blink 1s step-end infinite", display: "inline-block", marginRight: 6 }}>▶</span>
            Press F12 → Console
          </div>
        </>
      ) : allSolved ? (
        <>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: gold }}>
            ⬡ FINAL VAULT ⬡
          </div>
          <p style={{ fontSize: 10, color: "#4a6080", lineHeight: 1.9, maxWidth: 210 }}>
            Take the <strong style={{ color: gold }}>first character</strong> of each answer in order{" "}
            <strong style={{ color: gold }}>A → H</strong> and combine into the master key.
          </p>
          {/* Key builder visual */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px",
            width: "100%", fontSize: 10,
          }}>
            {HINTS.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: h.color, fontFamily: "'Orbitron', monospace", fontSize: 9, width: 14 }}>{h.id}</span>
                <span style={{ color: "#2a3a4a", fontSize: 9, flex: 1 }}>
                  {h.answer.length > 8 ? h.answer.slice(0, 8) + "…" : h.answer}
                </span>
                <span style={{ color: "#1e2e3e" }}>→</span>
                <span style={{ color: gold, fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 13 }}>
                  {h.answer[0]}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <input
              style={{
                flex: 1, background: "transparent", border: `1px solid ${gold}66`,
                borderRadius: 4, padding: "9px 12px", color: "#e0eeff",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none",
                letterSpacing: 2, textTransform: "uppercase",
              }}
              placeholder="Master key..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button onClick={handleSubmit} style={{
              background: `${gold}11`, border: `1px solid ${gold}66`,
              borderRadius: 4, color: gold, width: 44, cursor: "pointer", fontSize: 16,
            }}>▶</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40, opacity: 0.15, userSelect: "none" }}>⬡</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: gold }}>
            VAULT LOCKED
          </div>
          <p style={{ fontSize: 10, color: "#3a5070", lineHeight: 1.8 }}>
            Solve all 8 clues to unlock
          </p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
            {Array(8).fill(0).map((_, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#162030", display: "block" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function Round2() {
  const [layout] = useState(() => shuffleArray(HINTS));
  const [solved, setSolved] = useState({});
  const [finalSolved, setFinalSolved] = useState(false);
  const solvedCount = Object.keys(solved).length;
  const allSolved = solvedCount === 8;
  const gold = "#e8a838";

  const handleHintSolve = (id, answer) => setSolved(p => ({ ...p, [id]: answer }));

  const handleFinalSolve = () => {
    setFinalSolved(true);
    console.clear();
    console.log("%c╔══════════════════════════════════════════╗", `color:${gold};font-size:14px;`);
    console.log("%c║   🏆  GFG TREASURE UNLOCKED  🏆          ║", `color:${gold};font-size:14px;font-weight:bold;`);
    console.log("%c╚══════════════════════════════════════════╝", `color:${gold};font-size:14px;`);
    console.log("%c\nYour Secret Flag:", "color:#00ff9f;font-size:13px;");
    console.log(`%c${SECRET_FLAG}`,
      "color:#fff;background:#060c18;font-size:20px;font-weight:bold;padding:8px 20px;border-left:4px solid #e8a838;letter-spacing:2px;display:block;margin-top:4px;");
    console.log("%c\n📦 Also stored in localStorage — key: 'treasure_flag'", "color:#3a5070;font-size:11px;");
    console.log("%c🌐 Also visible in the Network tab (check XHR/Fetch)", "color:#3a5070;font-size:11px;");
    console.log("%c🔑 Also available at: window.__flag__", "color:#3a5070;font-size:11px;");
    localStorage.setItem("treasure_flag", SECRET_FLAG);
    localStorage.setItem("hint", "You found it via localStorage! The flag is the treasure_flag key.");
    fetch(`https://httpbin.org/get?flag=${encodeURIComponent(SECRET_FLAG)}&event=gfg_treasure_hunt`).catch(() => { });
    window.__flag__ = { value: SECRET_FLAG, msg: "You cracked the GFG NextNode. Well done." };
  };

  const gridCells = [];
  for (let i = 0; i < 9; i++) {
    if (i === 4) { gridCells.push({ type: "center" }); continue; }
    const hi = i < 4 ? i : i - 1;
    gridCells.push({ type: "hint", hint: layout[hi] });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #040608; }
        @keyframes scan {
          0% { top: -1px; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        input::placeholder { color: #2a3a50; font-size: 12px; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #162030; border-radius: 2px; }
        a:hover { opacity: 0.8; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#040608",
        backgroundImage: `
          radial-gradient(ellipse at 15% 40%, rgba(0,90,140,0.08) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 15%, rgba(0,50,90,0.1) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 90%, rgba(20,0,60,0.08) 0%, transparent 50%)
        `,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#b8cce0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 72px",
      }}>

        {/* ── HEADER ── */}
        <header style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 6, color: "#2a3a50", marginBottom: 10 }}>
            ◈ VIRTUAL TREASURE HUNT ◈
          </div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900,
            fontSize: "clamp(24px, 5vw, 52px)", letterSpacing: 8,
            color: gold, textShadow: `0 0 50px ${gold}55, 0 0 100px ${gold}1a`,
          }}>
            Next Node
          </h1>
          <div style={{ marginTop: 10, fontSize: 11, color: "#3a5070", letterSpacing: 2 }}>
            VISIT THE PAGE · FIND THE CODE · RUN IT · ENTER THE OUTPUT
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, fontSize: 11, justifyContent: "center" }}>
            <span style={{ color: allSolved ? "#00ff9f" : "#3a5070", minWidth: 36 }}>
              {solvedCount}/8
            </span>
            <div style={{ width: 220, height: 3, background: "#0e1a28", borderRadius: 2, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%",
                width: `${(solvedCount / 8) * 100}%`,
                background: `linear-gradient(90deg, #00cfff, ${gold})`,
                transition: "width 0.6s ease",
                borderRadius: 2,
              }} />
            </div>
            <span style={{ color: allSolved ? "#00ff9f" : "#3a5070" }}>
              {allSolved ? "▲ VAULT READY" : `${8 - solvedCount} left`}
            </span>
          </div>
        </header>

        {/* ── GRID ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          width: "100%",
          maxWidth: 1140,
        }}>
          {gridCells.map((cell, i) =>
            cell.type === "center" ? (
              <CenterCell
                key="center"
                allSolved={allSolved}
                onFinalSubmit={handleFinalSolve}
                isSolved={finalSolved}
              />
            ) : (
              <HintCell
                key={cell.hint.id}
                hint={cell.hint}
                isUnlocked={!!solved[cell.hint.id]}
                onSubmit={handleHintSolve}
                solvedAnswer={solved[cell.hint.id]}
              />
            )
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 32, fontSize: 10, color: "#1e2e3e", letterSpacing: 4, textAlign: "center" }}>
          GRID RANDOMISED PER SESSION &nbsp;·&nbsp; {new Date().toISOString().slice(0, 10)} &nbsp;·&nbsp; GFG CODE HUNT
        </div>
      </div>
    </>
  );
}
