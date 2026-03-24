# Virtual Treasure Hunt
## Round 2 – Shadow Trace

### Overview
Round 2 begins after participants successfully complete **Round 1** and retrieve the **Treasure Flag** from the browser DevTools.

The flag obtained in Round 1 acts as an **Access Token** to unlock the next stage of the hunt.

Participants must use their knowledge of **browser developer tools** to investigate hidden clues inside the web application.

---

## Entry Requirement

After completing Round 1, participants receive a flag similar to:

CTF{g33ks_hunt3r_m4st3r_2024}

This flag must be entered on the **Round 2 access page**.

Enter Access Token

If the flag is correct, the **Shadow Trace dashboard** unlocks.

---

## Round Theme

**Shadow Trace** focuses on **web debugging and investigation**.

Participants must search for clues hidden inside different parts of the website using browser developer tools.

They will explore:

- HTML structure
- Network requests
- Browser console
- Local storage
- JavaScript source files

Each challenge reveals a **fragment of the final password**.

---

## Puzzle Structure

Round 2 consists of **five investigation puzzles**.

Each puzzle provides a hint and requires participants to locate hidden information inside the webpage.

Every solved puzzle reveals a **password fragment**.

---

## Puzzle 1 – Inspect Element

**Hint**

The first trace lies inside the structure.

Participants should open **DevTools → Elements** and inspect the HTML.

Hidden inside the page:

```html
<!-- KEY_PART: SHADOW -->
```

Fragment obtained:

```
SHADOW
```

## Puzzle 2 – Network Investigation

Hint

Data flows through invisible channels.
Watch the traffic.

Participants open **DevTools → Network Tab** and reload the page.

A request appears:

```
/api/logs
```

Network response:

```
{
  "fragment": "NODE"
}
```

Fragment obtained:

```
NODE
```

## Puzzle 3 – Console Exploration

**Hint**

```
The console remembers everything.
Ask it the right question.
```

Participants open **DevTools → Console** and execute:

```
window.trace()
```

Console response:

```
fragment = "404"
```

Fragment obtained:

```
404
```

------

## Puzzle 4 – Local Storage

**Hint**

```
Some secrets are stored locally.
```

Participants open:

```
DevTools → Application → Local Storage
```

Stored value:

```
trace_key = MATRIX
```

Fragment obtained:

```
MATRIX
```

------

## Puzzle 5 – Source Code Investigation

**Hint**

```
The answer is hidden in the code that runs the system.
```

Participants open:

```
DevTools → Sources Tab
```

Inside a JavaScript file they find:

```
const hiddenFragment = "CORE";
```

Fragment obtained:

```
CORE
```

------

## Final Challenge

Participants combine all fragments obtained in the round.

```
SHADOW
NODE
404
MATRIX
CORE
```

Final password:

```
SHADOWNODE404MATRIXCORE
```

Entering the correct password unlocks **Round 3**.

------

## Skills Tested in Round 2

This round evaluates:

- Understanding of **browser developer tools**
- Web debugging and investigation
- Network request analysis
- Inspecting HTML structure
- Reading JavaScript source code

Participants must think like **developers and security analysts** to uncover hidden information.

------

## Round Outcome

Once the correct password is entered:

- Round 2 is completed
- The system unlocks **Round 3 – The Final Vault**
- Participants receive the **next clue for the final challenge**