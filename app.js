// Standalone Local Application Engine (No external keys or setup required)
const state = {
    username: 'Player ' + Math.floor(Math.random() * 100),
    currentRoom: 1,
    roomsData: {},
    isSinglePlayer: false, 
    isPaused: false,
    board: Array(9).fill(''),
    currentTurn: 'X',
    isGameActive: true,
    chatBlocked: false,
    scores: { X: 0, O: 0, ties: 0 }
};

// Initialize clean empty tracking structures for all 7 independent rooms natively
for (let i = 1; i <= 7; i++) {
    state.roomsData[i] = {
        messages: [
            { user: 'System', text: `Welcome to Chat Room ${i}! Share your live text thoughts here.` }
        ]
    };
}

// Target DOM nodes
const DOM = {
    usernameInput: document.getElementById('username-input'),
    btnSaveUsername: document.getElementById('btn-save-username'),
    modeToggle: document.getElementById('btn-mode-toggle'),
    pauseBtn: document.getElementById('btn-pause'),
    roomsContainer: document.getElementById('rooms-container'),
    roomTitle: document.getElementById('current-room-title'),
    roomOccupancy: document.getElementById('room-occupancy'),
    gameStatus: document.getElementById('game-status'),
    board: document.getElementById('game-board'),
    cells: document.querySelectorAll('.cell'),
    winBanner: document.getElementById('win-banner'),
    rulesModal: document.getElementById('rules-modal'),
    btnRules: document.getElementById('btn-rules'),
    closeRules: document.getElementById('close-rules'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    btnBlockChat: document.getElementById('btn-block-chat'),
    scoreX: document.getElementById('score-x-wins'),
    scoreO: document.getElementById('score-o-wins'),
    scoreTies: document.getElementById('score-ties'),
    btnReset: document.getElementById('btn-reset'),
    chatHeaderTitle: document.querySelector('.chat-header h3')
};

// Update header to read "Chat Room" directly programmatically
if (DOM.chatHeaderTitle) {
    DOM.chatHeaderTitle.textContent = "Chat Room";
}

const winConditions = [, [3, 4, 5], [6, 7, 8], // Rows, [1, 4, 7], [2, 5, 8], // Columns, [2, 4, 6]             // Diagonals
];

function init() {
    if (DOM.usernameInput) DOM.usernameInput.value = state.username;
    renderRoomsList();
    setupEventListeners();
    switchRoom(1);
}

function setupEventListeners() {
    DOM.cells.forEach(cell => cell.addEventListener('click', () => handleCellClick(cell)));
    DOM.modeToggle.addEventListener('click', toggleGameMode);
    DOM.pauseBtn.addEventListener('click', togglePause);
    DOM.btnRules.addEventListener('click', () => DOM.rulesModal.classList.remove('hidden'));
    DOM.closeRules.addEventListener('click', () => DOM.rulesModal.classList.add('hidden'));
    DOM.btnSendChat.addEventListener('click', sendChatMessage);
    DOM.btnBlockChat.addEventListener('click', toggleChatBlock);
    DOM.btnReset.addEventListener('click', localReset);
    if (DOM.btnSaveUsername) DOM.btnSaveUsername.addEventListener('click', updateUsername);
    DOM.chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });
}

function switchRoom(roomNum) {
    state.currentRoom = roomNum;
    DOM.roomTitle.textContent = `Room ${roomNum}`;
    
    // Simulate updating room count badge text dynamically 
    DOM.roomOccupancy.textContent = `Users: ${Math.floor(Math.random() * 4) + 2}`;
    
    localReset();
    renderRoomsList();
    renderChatHistory();
}

function renderRoomsList() {
    DOM.roomsContainer.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
        const btn = document.createElement('button');
        btn.className = `room-btn ${state.currentRoom === i ? 'active' : ''}`;
        btn.innerHTML = `<span>Room ${i}</span> <small>👥 Live</small>`;
        btn.onclick = () => switchRoom(i);
        DOM.roomsContainer.appendChild(btn);
    }
}

function handleCellClick(cell) {
    const index = cell.getAttribute('data-index');
    if (state.board[index] !== '' || !state.isGameActive || state.isPaused) return;

    executeMove(index, state.currentTurn);

    if (evaluateGameOutcome()) return;

    if (state.isSinglePlayer) {
        state.currentTurn = 'O';
        DOM.gameStatus.textContent = "AI Processing Move...";
        setTimeout(executeAIMove, 500);
    } else {
        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
        DOM.gameStatus.textContent = `Player ${state.currentTurn}'s Turn`;
    }
}

function executeMove(index, player) {
    state.board[index] = player;
    DOM.cells[index].textContent = player;
    DOM.cells[index].className = `cell ${player.toLowerCase()}`;
}

function executeAIMove() {
    if (!state.isGameActive || state.isPaused) return;
    const available = state.board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
    if (available.length > 0) {
        const choice = available[Math.floor(Math.random() * available.length)];
        executeMove(choice, 'O');
        if (!evaluateGameOutcome()) {
            state.currentTurn = 'X';
            DOM.gameStatus.textContent = "Player X's Turn";
        }
    }
}

function evaluateGameOutcome() {
    let matchWon = false;
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            matchWon = true;
            break;
        }
    }

    if (matchWon) {
        triggerWinSequences(state.currentTurn);
        return true;
    }

    if (!state.board.includes('')) {
        state.scores.ties++;
        DOM.scoreTies.textContent = state.scores.ties;
        DOM.gameStatus.textContent = "Match Ended in Tie!";
        state.isGameActive = false;
        return true;
    }
    return false;
}

function triggerWinSequences(winner) {
    state.isGameActive = false;
    DOM.gameStatus.textContent = `Player ${winner} Victorious!`;
    
    if (winner === 'X') {
        state.scores.X++;
        DOM.scoreX.textContent = state.scores.X;
    } else {
        state.scores.O++;
        DOM.scoreO.textContent = state.scores.O;
    }

    DOM.winBanner.classList.remove('hidden');
    setTimeout(() => { DOM.winBanner.classList.add('hidden'); }, 4000);
}

function sendChatMessage() {
    if (state.chatBlocked) return;
    const value = DOM.chatInput.value.trim();
    if (!value) return;

    state.roomsData[state.currentRoom].messages.push({ user: state.username, text: value });
    DOM.chatInput.value = '';
    renderChatHistory();
}

function localReset() {
    state.board = Array(9).fill('');
    state.isGameActive = true;
    state.currentTurn = 'X';
    DOM.gameStatus.textContent = "Player X's Turn";
    DOM.cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
}

function updateUsername() {
    const inputName = DOM.usernameInput.value.trim();
    if (inputName) {
        state.username = inputName;
        alert(`Name saved as: ${state.username}`);
    }
}

function renderChatHistory() {
    DOM.chatMessages.innerHTML = '';
    state.roomsData[state.currentRoom].messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg';
        bubble.innerHTML = `<span class="author">${msg.user}:</span> ${msg.text}`;
        DOM.chatMessages.appendChild(bubble);
    });
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function toggleGameMode() {
    state.isSinglePlayer = !state.isSinglePlayer;
    DOM.modeToggle.textContent = state.isSinglePlayer ? "Switch to 2-Player Pass Mode" : "Switch to Single Player";
    DOM.pauseBtn.classList.toggle('hidden', !state.isSinglePlayer);
    localReset();
}

function togglePause() {
    if (!state.isSinglePlayer) return;
    state.isPaused = !state.isPaused;
    DOM.pauseBtn.textContent = state.isPaused ? "Resume Game" : "Pause Game";
    DOM.gameStatus.textContent = state.isPaused ? "Game Paused" : `Player ${state.currentTurn}'s Turn`;
}

function toggleChatBlock() {
    state.chatBlocked = !state.chatBlocked;
    DOM.btnBlockChat.textContent = state.chatBlocked ? "Unblock Chat" : "Block Chat";
    DOM.btnBlockChat.classList.toggle('active', state.chatBlocked);
    DOM.chatMessages.classList.toggle('chat-blocked', state.chatBlocked);
    DOM.chatInput.disabled = state.chatBlocked;
    DOM.btnSendChat.disabled = state.chatBlocked;
}

init();
