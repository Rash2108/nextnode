# 🧩 Virtual Treasure Hunt – Round 1

## Next Node – Code Hunt

Round 1 is a **technical puzzle round** where participants solve coding challenges by visiting programming documentation pages and executing code snippets.

The goal of the round is to **find the correct outputs from code examples** and use them to **unlock the final vault**.

---

# 🎯 Round Concept

The interface displays a **3 × 3 puzzle grid**.

- **8 blocks** contain coding puzzles.
- The **center block** is the **Final Vault**.

[ Puzzle ] [ Puzzle ] [ Puzzle ]
[ Puzzle ] [ VAULT ] [ Puzzle ]
[ Puzzle ] [ Puzzle ] [ Puzzle ]

Participants must solve all puzzles to unlock the vault.

---

# 🔀 Randomized Grid System

Each participant sees puzzles in **different positions**.

The system **shuffles puzzle locations every session**, ensuring:

- Players cannot copy answers from others
- Every player experiences a **unique layout**
- Fair play across all participants

Even though **positions change**, the **puzzles themselves remain the same**.

---

# 🧠 Puzzle Structure

Each puzzle contains a **3-step mission card**.

## Step 1 – Visit the Source

Participants receive a link to a **GeeksforGeeks article**.

Example:

> Visit the GeeksforGeeks article on **Python Lists**.

---

## Step 2 – Locate the Code Example

Participants must identify a **specific code snippet** described in the puzzle.

Example:

> Find the code example that creates a list called **`thislist`**.

---

## Step 3 – Execute and Find Output

Participants must:

1. Run the code using **GeeksforGeeks IDE** or their **own compiler**
2. Identify the correct output

Example question:

> What is the **second element printed**?

They then **enter the answer into the puzzle box**.

---

# 📚 Puzzle Topics

The puzzles cover **multiple programming languages and concepts**.

| Puzzle  | Topic                 |
| ------- | --------------------- |
| ALPHA   | Python Lists          |
| BETA    | Java Arrays           |
| GAMMA   | Python Dictionaries   |
| DELTA   | JavaScript Arrays     |
| EPSILON | Python Stack          |
| ZETA    | Java String Length    |
| ETA     | Python String Methods |
| THETA   | Java Math Functions   |

This ensures the round tests **general programming knowledge**, not just one language.

---

# 🔓 Puzzle Unlock Mechanism

When the participant enters the **correct answer**:

- The puzzle **unlocks**
- The **correct output is displayed**
- A **visual confirmation** appears on the puzzle card

This allows players to **track their solved puzzles**.

---

# 📊 Progress Tracking

A **progress bar** at the top of the page shows:

- Number of puzzles solved
- Remaining puzzles
- Vault status

Example:

3 / 8 solved
5 puzzles remaining

Once **all 8 puzzles are solved**, the **Final Vault becomes accessible**.

---

# 🔑 Final Vault Challenge

After solving all puzzles, participants must generate a **Master Key**.

### Rule

Take the **first character of each answer**  
in **alphabetical order of puzzles (A → H)**.

---

### Example

| Puzzle | Answer        | First Letter |
| ------ | ------------- | ------------ |
| A      | BANANA        | B            |
| B      | 5             | 5            |
| C      | FORD          | F            |
| D      | 5             | 5            |
| E      | 3             | 3            |
| F      | 13            | 1            |
| G      | GEEKSFORGEEKS | G            |
| H      | 5             | 5            |

### Final Key

B5F531G5

Participants enter this **key into the center vault block**.

---

# 🏆 Final Reward

When the **correct master key** is entered:

- The **vault unlocks**
- A **secret flag appears in browser developer tools**

Participants must open:

F12 → Console

The **final treasure flag** can be discovered in:

- Console output
- `localStorage`
- Network requests
- JavaScript global variables

This encourages exploration of **browser developer tools**.

---

# 🧪 Skills Tested in Round 1

This round evaluates several technical abilities:

- Code reading and understanding
- Running code snippets
- Debugging logic
- Web navigation and research
- Basic developer tools usage

The round encourages participants to **interact with real programming resources** instead of answering purely theoretical questions.

---

# 🚀 End Goal

Solve **8 coding puzzles → Generate Master Key → Unlock Vault → Find the Treasure Flag**.
