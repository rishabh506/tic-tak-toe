/**
 * CRASH-RESISTANT VERIFIED TIC TAC TOE ENGINE
 */

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const MOTIVATIONAL_QUOTES = [
    "Consistency is the blueprint of mastery.",
    "Every defeat is a secret doorway to strategic growth.",
    "Flawless execution! Keep pushing boundaries.",
    "The Minimax system calculates your destiny, can you break it?",
    "Simplicity is the ultimate sophistication."
];

const GAME_MODES = { SINGLE: 'single', MULTI: 'multi' };
const DIFFICULTIES = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' };

let state = {
    currentMode: GAME_MODES.SINGLE,
    difficulty: DIFFICULTIES.EASY,
    board: Array(9).fill(""),
    isXTurn: true,
    isGameActive: false,
    scores: { x: 0, o: 0, draws: 0, totalMatches: 0 },
    history: [], 
    timer: { seconds: 0, intervalId: null },
    soundEnabled: true,
    theme: 'dark',
    names: { x: "Player X", o: "Player O" }
};

const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage not available", e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage not available", e);
        }
    }
};

// Helper function to safely bind events without crashing if an element is missing
const safeBind = (id, event, callback) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, callback);
    } else {
        console.warn(`[TicTacToe] Element with ID '${id}' not found in your HTML. Skipping safely.`);
    }
};

const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("Web Audio API not supported", e);
            }
        }
    },
    play(type) {
        if (!state.soundEnabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            const now = this.ctx.currentTime;

            if (type === 'click') {
                osc.frequency.setValueAtTime(440, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'win') {
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'lose') {
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.25);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
            } else if (type === 'draw') {
                osc.frequency.setValueAtTime(300, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            }
        } catch(e) {
            console.error("Audio failed to play context safely", e);
        }
    }
};

const ConfettiEngine = {
    canvas: null, ctx: null, particles: [], animationId: null,
    init() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => this.resize());
        this.resize();
    },
    resize() {
        if(this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    },
    spawn() {
        if (!this.canvas) return;
        this.particles = [];
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                r: Math.random() * 3 + 3,
                d: Math.random() * this.canvas.height,
                color: ['#ff416c', '#00c6ff', '#fbbf24', '#34d399'][Math.floor(Math.random() * 4)],
                tiltAngle: Math.random() * Math.PI,
                tiltSpeed: Math.random() * 0.03 + 0.01
            });
        }
        if (!this.animationId) this.loop();
    },
    loop() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let alive = false;
        this.particles.forEach(p => {
            p.tiltAngle += p.tiltSpeed;
            p.y += 2.5;
            p.x += Math.sin(p.tiltAngle);
            if (p.y <= this.canvas.height) {
                alive = true;
                this.ctx.beginPath();
                this.ctx.lineWidth = p.r;
                this.ctx.strokeStyle = p.color;
                this.ctx.moveTo(p.x + Math.sin(p.tiltAngle) * 4, p.y);
                this.ctx.lineTo(p.x, p.y + Math.cos(p.tiltAngle) * 4);
                this.ctx.stroke();
            }
        });
        if (alive) this.animationId = requestAnimationFrame(() => this.loop());
        else this.animationId = null;
    },
    clear() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

const Engine = {
    makeMove(index, marker) {
        state.board[index] = marker;
        state.history.push([...state.board]);
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.setAttribute('data-marker', marker);
            cell.innerText = marker;
            cell.disabled = true;
        }
        this.logMove(marker, index);
        AudioEngine.play('click');
    },

    logMove(marker, index) {
        const logBox = document.getElementById('history-log');
        if (!logBox) return;
        const emptyMsg = logBox.querySelector('.empty-log-msg');
        if (emptyMsg) emptyMsg.remove();

        const coordMap = ["Top-Left", "Top-Mid", "Top-Right", "Mid-Left", "Center", "Mid-Right", "Bot-Left", "Bot-Mid", "Bot-Right"];
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span>Move ${state.history.length}: <strong>${marker}</strong></span> <span>${coordMap[index]}</span>`;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    },

    checkWinner(boardState) {
        for (let combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return { winner: boardState[a], combination: combo };
            }
        }
        if (boardState.every(cell => cell !== "")) return { winner: 'draw' };
        return null;
    },

    computeComputerMove() {
        if (!state.isGameActive) return;

        if (state.difficulty === DIFFICULTIES.EASY) {
            this.executeRandomMove();
        } else if (state.difficulty === DIFFICULTIES.MEDIUM) {
            Math.random() < 0.7 ? this.executeSmartMove() : this.executeRandomMove();
        } else {
            this.executeSmartMove();
        }
    },

    executeRandomMove() {
        const available = state.board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
        if(available.length === 0) return;
        const choice = available[Math.floor(Math.random() * available.length)];
        this.commitComputerChoice(choice);
    },

    executeSmartMove() {
        let bestScore = -Infinity;
        let choice = null;
        for (let i = 0; i < 9; i++) {
            if (state.board[i] === "") {
                state.board[i] = "O";
                let score = this.minimax(state.board, 0, false);
                state.board[i] = "";
                if (score > bestScore) {
                    bestScore = score;
                    choice = i;
                }
            }
        }
        this.commitComputerChoice(choice);
    },

    commitComputerChoice(index) {
        if (index !== null && index !== undefined) {
            this.makeMove(index, "O");
            state.isXTurn = true;
            this.evaluateMatchState();
        }
    },

    minimax(tempBoard, depth, isMaximizing) {
        const result = this.checkWinner(tempBoard);
        if (result) {
            if (result.winner === 'O') return 10 - depth;
            if (result.winner === 'X') return depth - 10;
            if (result.winner === 'draw') return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === "") {
                    tempBoard[i] = "O";
                    let score = this.minimax(tempBoard, depth + 1, false);
                    tempBoard[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === "") {
                    tempBoard[i] = "X";
                    let score = this.minimax(tempBoard, depth + 1, true);
                    tempBoard[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    },

    evaluateMatchState() {
        const outcome = this.checkWinner(state.board);
        if (outcome) {
            this.terminateMatch(outcome);
            return;
        }

        const statusElement = document.getElementById('game-status');
        const cardX = document.querySelector('.player-x-card');
        const cardO = document.querySelector('.player-o-card');
        const undoBtn = document.getElementById('btn-undo');

        if (state.isXTurn) {
            if(statusElement) statusElement.innerText = `${state.names.x} Turn`;
            if(cardX) cardX.classList.add('active-turn');
            if(cardO) cardO.classList.remove('active-turn');
            if(undoBtn) undoBtn.disabled = (state.currentMode !== GAME_MODES.MULTI || state.history.length === 0);
        } else {
            if(cardO) cardO.classList.add('active-turn');
            if(cardX) cardX.classList.remove('active-turn');
            if(undoBtn) undoBtn.disabled = true;

            if (state.currentMode === GAME_MODES.SINGLE) {
                if(statusElement) statusElement.innerText = `${state.names.o} Thinking...`;
                state.isGameActive = false; 
                setTimeout(() => {
                    state.isGameActive = true;
                    this.computeComputerMove();
                }, 500);
            } else {
                if(statusElement) statusElement.innerText = `${state.names.o} Turn`;
                if(undoBtn) undoBtn.disabled = false;
            }
        }
    },

    terminateMatch(outcome) {
        state.isGameActive = false;
        clearInterval(state.timer.intervalId);
        document.querySelectorAll('.cell').forEach(cell => cell.disabled = true);
        
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) undoBtn.disabled = true;

        state.scores.totalMatches++;
        safeStorage.setItem('ttt_total_matches', state.scores.totalMatches);
        
        const totalGamesEl = document.getElementById('stat-total-games');
        if (totalGamesEl) totalGamesEl.innerText = state.scores.totalMatches;

        const overlay = document.getElementById('match-overlay');
        const resultText = document.getElementById('overlay-result-text');
        const quoteBox = document.getElementById('motivational-quote');

        if(quoteBox) quoteBox.innerText = `"${MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]}"`;

        if (outcome.winner === 'draw') {
            state.scores.draws++;
            safeStorage.setItem('ttt_draws', state.scores.draws);
            const scoreDrawsEl = document.getElementById('score-draws');
            if (scoreDrawsEl) scoreDrawsEl.innerText = state.scores.draws;
            
            const gameStatusEl = document.getElementById('game-status');
            if (gameStatusEl) gameStatusEl.innerText = "Match Draw!";
            if(resultText) resultText.innerText = "It's a Draw!";
            AudioEngine.play('draw');
        } else {
            outcome.combination.forEach(idx => {
                const cell = document.querySelector(`.cell[data-index="${idx}"]`);
                if (cell) cell.classList.add('win-glow');
            });

            const gameStatusEl = document.getElementById('game-status');
            if (outcome.winner === 'X') {
                state.scores.x++;
                safeStorage.setItem('ttt_score_x', state.scores.x);
                const scoreXEl = document.getElementById('score-x');
                if (scoreXEl) scoreXEl.innerText = state.scores.x;
                if (gameStatusEl) gameStatusEl.innerText = `${state.names.x} Wins!`;
                if(resultText) resultText.innerText = `${state.names.x} Wins!`;
                ConfettiEngine.spawn();
                AudioEngine.play('win');
            } else {
                state.scores.o++;
                safeStorage.setItem('ttt_score_o', state.scores.o);
                const scoreOEl = document.getElementById('score-o');
                if (scoreOEl) scoreOEl.innerText = state.scores.o;
                
                if (state.currentMode === GAME_MODES.SINGLE) {
                    if (gameStatusEl) gameStatusEl.innerText = `${state.names.o} Wins!`;
                    if(resultText) resultText.innerText = `${state.names.o} Wins!`;
                    AudioEngine.play('lose');
                } else {
                    if (gameStatusEl) gameStatusEl.innerText = `${state.names.o} Wins!`;
                    if(resultText) resultText.innerText = `${state.names.o} Wins!`;
                    ConfettiEngine.spawn();
                    AudioEngine.play('win');
                }
            }
        }

        setTimeout(() => {
            if(overlay) overlay.classList.remove('hidden');
        }, 400);
    },

    undoLastMove() {
        if (state.currentMode !== GAME_MODES.MULTI || state.history.length === 0) return;

        state.history.pop();
        const precedingState = state.history.length > 0 ? [...state.history[state.history.length - 1]] : Array(9).fill("");
        state.board = precedingState;

        state.board.forEach((marker, index) => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            if (cell) {
                cell.innerText = marker;
                cell.setAttribute('data-marker', marker);
                cell.disabled = marker !== "";
            }
        });

        const logBox = document.getElementById('history-log');
        if (logBox && logBox.lastChild) logBox.removeChild(logBox.lastChild);
        if (state.history.length === 0 && logBox) {
            logBox.innerHTML = '<p class="empty-log-msg">No moves logged yet.</p>';
        }

        state.isXTurn = !state.isXTurn;
        this.evaluateMatchState();
    }
};

const UIManager = {
    init() {
        this.loadLocalStorageData();
        this.bindEvents();
        ConfettiEngine.init();
    },

    loadLocalStorageData() {
        state.scores.x = parseInt(safeStorage.getItem('ttt_score_x')) || 0;
        state.scores.o = parseInt(safeStorage.getItem('ttt_score_o')) || 0;
        state.scores.draws = parseInt(safeStorage.getItem('ttt_draws')) || 0;
        state.scores.totalMatches = parseInt(safeStorage.getItem('ttt_total_matches')) || 0;

        const scoreXEl = document.getElementById('score-x');
        const scoreOEl = document.getElementById('score-o');
        const scoreDrawsEl = document.getElementById('score-draws');
        const totalGamesEl = document.getElementById('stat-total-games');
        const diffSelectEl = document.getElementById('difficulty-select');

        if (scoreXEl) scoreXEl.innerText = state.scores.x;
        if (scoreOEl) scoreOEl.innerText = state.scores.o;
        if (scoreDrawsEl) scoreDrawsEl.innerText = state.scores.draws;
        if (totalGamesEl) totalGamesEl.innerText = state.scores.totalMatches;

        state.theme = safeStorage.getItem('ttt_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);

        state.soundEnabled = safeStorage.getItem('ttt_sound') !== 'off';
        document.body.setAttribute('data-sound', state.soundEnabled ? 'on' : 'off');

        state.difficulty = safeStorage.getItem('ttt_difficulty') || DIFFICULTIES.EASY;
        if (diffSelectEl) diffSelectEl.value = state.difficulty;

        state.names.x = safeStorage.getItem('ttt_name_x') || "Player X";
        state.names.o = safeStorage.getItem('ttt_name_o') || "Player O";

        const labelX = document.getElementById('label-x');
        const labelO = document.getElementById('label-o');
        if (labelX) labelX.innerText = state.names.x;
        if (labelO) labelO.innerText = state.names.o;
    },

    bindEvents() {
        safeBind('theme-toggle', 'click', () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', state.theme);
            safeStorage.setItem('ttt_theme', state.theme);
        });

        safeBind('sound-toggle', 'click', () => {
            state.soundEnabled = !state.soundEnabled;
            document.body.setAttribute('data-sound', state.soundEnabled ? 'on' : 'off');
            safeStorage.setItem('ttt_sound', state.soundEnabled ? 'on' : 'off');
            AudioEngine.init();
        });

        safeBind('btn-single', 'click', () => this.showSetupScreen(GAME_MODES.SINGLE));
        safeBind('btn-multi', 'click', () => this.showSetupScreen(GAME_MODES.MULTI));
        safeBind('btn-setup-back', 'click', () => this.showScreen('home-screen'));
        safeBind('btn-start-game', 'click', () => this.handleStartGame());
        safeBind('btn-back', 'click', () => this.showScreen('home-screen'));
        safeBind('btn-info-back', 'click', () => this.showScreen('home-screen'));
        safeBind('btn-how', 'click', () => this.showInfoScreen('how'));
        safeBind('btn-about', 'click', () => this.showInfoScreen('about'));
        safeBind('btn-restart', 'click', () => this.resetMatch());
        safeBind('btn-undo', 'click', () => Engine.undoLastMove());
        safeBind('btn-play-again', 'click', () => this.resetMatch());

        safeBind('difficulty-select', 'change', (e) => {
            state.difficulty = e.target.value;
            safeStorage.setItem('ttt_difficulty', state.difficulty);
            this.resetMatch();
        });

        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.addEventListener('click', (e) => {
                const cell = e.target.closest('.cell');
                if (!cell || !state.isGameActive) return;
                
                const index = parseInt(cell.getAttribute('data-index'));
                if (state.board[index] !== "") return;

                const operationalMarker = state.isXTurn ? "X" : "O";
                Engine.makeMove(index, operationalMarker);
                state.isXTurn = !state.isXTurn;
                Engine.evaluateMatchState();
            });
        }

        safeBind('btn-reset-scores', 'click', () => {
            if (confirm("Reset all scoreboards permanently?")) {
                state.scores = { x: 0, o: 0, draws: 0, totalMatches: 0 };
                safeStorage.setItem('ttt_score_x', 0);
                safeStorage.setItem('ttt_score_o', 0);
                safeStorage.setItem('ttt_draws', 0);
                safeStorage.setItem('ttt_total_matches', 0);
                
                const scoreXEl = document.getElementById('score-x');
                const scoreOEl = document.getElementById('score-o');
                const scoreDrawsEl = document.getElementById('score-draws');
                const totalGamesEl = document.getElementById('stat-total-games');
                
                if (scoreXEl) scoreXEl.innerText = 0;
                if (scoreOEl) scoreOEl.innerText = 0;
                if (scoreDrawsEl) scoreDrawsEl.innerText = 0;
                if (totalGamesEl) totalGamesEl.innerText = 0;
                this.resetMatch();
            }
        });
    },

    showScreen(screenId) {
        document.querySelectorAll('.view-screen').forEach(scr => scr.classList.add('hidden'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.remove('hidden');
        if (screenId !== 'game-screen') {
            clearInterval(state.timer.intervalId);
        }
    },

    launchGame(mode) {
        state.currentMode = mode;
        const diffContainer = document.getElementById('difficulty-selector-container');
        const labelO = document.getElementById('label-o');
        const labelX = document.getElementById('label-x');

        if (mode === GAME_MODES.SINGLE) {
            if(diffContainer) diffContainer.classList.remove('hidden');
        } else {
            if(diffContainer) diffContainer.classList.add('hidden');
        }

        if(labelX) labelX.innerText = state.names.x;
        if(labelO) labelO.innerText = state.names.o;

        this.showScreen('game-screen');
        this.resetMatch();
    },

    resetMatch() {
        const overlay = document.getElementById('match-overlay');
        if (overlay) overlay.classList.add('hidden');

        ConfettiEngine.clear();

        state.board = Array(9).fill("");
        state.isXTurn = true;
        state.isGameActive = true;
        state.history = [];

        const statusText = document.getElementById('game-status');
        if(statusText) statusText.innerText = `${state.names.x} Turn`;

        const cardX = document.querySelector('.player-x-card');
        const cardO = document.querySelector('.player-o-card');
        if(cardX) cardX.classList.add('active-turn');
        if(cardO) cardO.classList.remove('active-turn');

        const labelX = document.getElementById('label-x');
        const labelO = document.getElementById('label-o');
        if(labelX) labelX.innerText = state.names.x;
        if(labelO) labelO.innerText = state.names.o;

        const logBox = document.getElementById('history-log');
        if(logBox) logBox.innerHTML = '<p class="empty-log-msg">No moves logged yet.</p>';
        
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) undoBtn.disabled = true;

        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerText = "";
            cell.removeAttribute('data-marker');
            cell.classList.remove('win-glow');
            cell.disabled = false;
        });

        this.startTimer();
    },

    startTimer() {
        clearInterval(state.timer.intervalId);
        state.timer.seconds = 0;
        const display = document.getElementById('timer-display');
        if(display) display.innerText = "00:00";

        state.timer.intervalId = setInterval(() => {
            state.timer.seconds++;
            const mins = String(Math.floor(state.timer.seconds / 60)).padStart(2, '0');
            const secs = String(state.timer.seconds % 60).padStart(2, '0');
            if(display) display.innerText = `${mins}:${secs}`;
        }, 1000);
    },

    showInfoScreen(type) {
        const body = document.getElementById('info-content');
        if(!body) return;
        if (type === 'how') {
            body.innerHTML = `
                <h2>How To Play</h2>
                <p>Tic Tac Toe is played on a classic 3x3 grid system.</p>
                <ul>
                    <li>Choose <strong>Single Player</strong> to challenge the AI or <strong>Multiplayer</strong> to play locally.</li>
                    <li>The first player marks spaces with <strong>X</strong>. The second outputs <strong>O</strong>.</li>
                    <li>Align 3 markers sequentially (horizontally, vertically, or diagonally) to win.</li>
                </ul>
            `;
        } else {
            body.innerHTML = `
                <h2>About This Build</h2>
                <p>This engine is optimized cleanly utilizing strict browser Vanilla ES6 JavaScript and HTML5 layouts.</p>
                <ul>
                    <li><strong>No Frameworks:</strong> Direct fast interpretation.</li>
                    <li><strong>Minimax Matrix:</strong> Calculations happen instantly client-side.</li>
                </ul>
            `;
        }
        this.showScreen('info-screen');
    },

    showSetupScreen(mode) {
        state.currentMode = mode;
        const setupTitle = document.getElementById('setup-title');
        const labelXInput = document.getElementById('label-player-x-input');
        const inputX = document.getElementById('input-player-x');
        const groupO = document.getElementById('player-o-input-group');
        const inputO = document.getElementById('input-player-o');
        const groupDiff = document.getElementById('setup-difficulty-group');
        const selectDiff = document.getElementById('setup-difficulty-select');

        if (mode === GAME_MODES.SINGLE) {
            if (setupTitle) setupTitle.innerText = "Single Player Setup";
            if (labelXInput) labelXInput.innerText = "Your Name";
            if (inputX) inputX.value = state.names.x === "Player X" ? "Player" : state.names.x;
            if (groupO) groupO.classList.add('hidden');
            if (groupDiff) groupDiff.classList.remove('hidden');
            if (selectDiff) selectDiff.value = state.difficulty;
        } else {
            if (setupTitle) setupTitle.innerText = "Multiplayer Setup";
            if (labelXInput) labelXInput.innerText = "Player X Name";
            if (inputX) inputX.value = state.names.x;
            if (groupO) groupO.classList.remove('hidden');
            if (inputO) inputO.value = state.names.o === "Computer" ? "Player O" : state.names.o;
            if (groupDiff) groupDiff.classList.add('hidden');
        }
        this.showScreen('setup-screen');
    },

    handleStartGame() {
        const inputX = document.getElementById('input-player-x');
        const inputO = document.getElementById('input-player-o');
        const selectDiff = document.getElementById('setup-difficulty-select');

        let nameX = inputX ? inputX.value.trim() : "";
        let nameO = inputO ? inputO.value.trim() : "";

        if (state.currentMode === GAME_MODES.SINGLE) {
            state.names.x = nameX || "Player";
            state.names.o = "Computer";
            state.difficulty = selectDiff ? selectDiff.value : DIFFICULTIES.EASY;
            
            safeStorage.setItem('ttt_name_x', state.names.x);
            safeStorage.setItem('ttt_difficulty', state.difficulty);
        } else {
            state.names.x = nameX || "Player X";
            state.names.o = nameO || "Player O";
            
            safeStorage.setItem('ttt_name_x', state.names.x);
            safeStorage.setItem('ttt_name_o', state.names.o);
        }

        // Update game screen difficulty select to match
        const gameDiffSelect = document.getElementById('difficulty-select');
        if (gameDiffSelect) gameDiffSelect.value = state.difficulty;

        this.launchGame(state.currentMode);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIManager.init());
} else {
    UIManager.init();
}