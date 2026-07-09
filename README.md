# Tic Tac Toe | Modern High-Performance Terminal

A modern, production-quality, responsive Tic Tac Toe game engineered entirely using native web technologies (**Vanilla ES6+ JavaScript, Semantic HTML5, and Modern CSS3**). This architecture avoids any framework or library dependencies, executing high-fidelity AI calculations and real-time audio synthesis natively inside the client browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/dependencies-none-brightgreen.svg)
![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange.svg)

---

## 🔗 Live Deployments

*   **Live Interactive Demo:** [👉 Click Here to Play](https://rishabh506.github.io/tic-tak-toe/)
*   **Source Code Repository:** [👉 GitHub Repository](https://github.com/rishabh506/tic-tak-toe)

---

## 🛠️ Architectural Highlights & Features

### 1. Artificial Intelligence Core (Minimax)
The **Single Player** module features three distinct tiers of difficulty:
*   **Easy:** Random vector selection across remaining cells.
*   **Medium:** A balanced heuristic matrix (70% optimal choices / 30% randomized choices).
*   **Hard:** Implements a fully recursive **Minimax Algorithm** that constructs a complete look-ahead game decision tree. It is mathematically impossible to beat.
*   *Note:* The AI includes a artificial `500ms` thinking delay to replicate natural player cadence.

### 2. Native Web Audio API Synthesizer
To maximize performance and bypass network latency spikes, all audio states (Clicks, Wins, Losses, Draws) are synthesized dynamically using native browser AudioContext nodes. It leverages tailored waveforms (`sine`, `triangle`, `sawtooth`) and exponential frequency ramps to engineer high-fidelity acoustic feedback with absolute zero asset load overhead.

### 3. State Management & Real-Time Analytics
*   **Decoupled Architecture:** Application view switches and core game loops are strictly isolated into distinct modules (`Engine`, `UIManager`, `AudioEngine`, `ConfettiEngine`).
*   **Persistent Storage:** LocalStorage synchronizes score tallies, selected game modes, active difficulties, audio preferences, and user interface color themes seamlessly across page restarts.
*   **Advanced Game Flow:** Includes an advanced match step history log, local move auditing, match timer clocks, and a strategic **Move Undo** mechanism (exclusive to Multiplayer mode).

### 4. Modern UI/UX Engineering
*   **Glassmorphism Layering:** Built using modern CSS custom properties, backdrop filters, and smooth state-transition matrices.
*   **Interactive Effects:** Custom inline vector mathematical calculations drive an independent `<canvas>` confetti blast upon evaluation of winning combinations. No external confetti injectors were utilized.
*   **Theme Engine:** An animated theme engine swaps stylesheets dynamically using semantic document tokens (`data-theme="dark"` / `data-theme="light"`).

### 5. Strict Accessibility Compliance
*   Engineered with modern keyboard-traversal boundaries (`:focus-visible` indicators).
*   Complete semantic layouts enriched with explicit `aria-live` regions, `role="grid"`, and custom `aria-label` matrices ensuring high screen-reader optimization.

---

## 📂 Project Structure

```text
Project/
│
├── index.html       # Semantic layout structure, modal setups, and SVG asset
├── style.css        # Central design tokens, glassmorphic layout, and theme matrices
├── script.js        # Core game engine, Minimax logic, and Audio synthesizers
└── favicon.svg      # Custom designed vector brand identity icon
```
