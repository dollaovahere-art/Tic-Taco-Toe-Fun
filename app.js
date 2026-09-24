// Application State Database
const state = {
    currentRoom: 1,
    roomsData: {},
    isSinglePlayer: true,
    isPaused: false,
    board: Array(9).fill(''),
    currentTurn: 'X',
    isGameActive: true,
    chatBlocked: false,
    scores: { X: 0, O: 0, ties: 0 }
};

// Initialize up to seven multi-rooms data properties
for (let i = 1; i <= 7; i++) {
    state.roomsData[i] = {
        spectatorsCount: Math.floor(Math.random() * 4) + 1, // Random spectators generated safely
        messages: [
            { user: 'Spectator 1', text: 'Good luck match participants!' },
            { user: 'Spectator 2', text: 'Excited to see this game layout setup.' }
        ]
    };
}

// Target DOM nodes
const DOM = {
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
    btnReset: document.getElementById('btn-reset')
};

const winConditions = [
    [0,1,2], [3,4,5], [6,7,8], // Rows
    [0,3,6], [1,4,7], [2,5,8], // Columns
    [0,4,8], [2,4,6]           // Diagonals
];

// App Initialization
function init() {
    renderRoomsList();
    switchRoom(1);
    setupEventListeners();
}

function setupEventListeners() {
    DOM.cells.forEach(cell => cell.addEventListener('click', () => handleCellClick(cell)));
    DOM.modeToggle.addEventListener('click', toggleGameMode);
    DOM.pauseBtn.addEventListener('click', togglePause);
    DOM.btnRules.addEventListener('click', () => DOM.rulesModal.classList.remove('hidden'));
    DOM.closeRules.addEventListener('click', () => DOM.rulesModal.classList.add('hidden'));
    DOM.btnSendChat.addEventListener('click', sendChatMessage);
    DOM.btnBlockChat.addEventListener('click', toggleChatBlock);
    DOM.btnReset.addEventListener('click', resetBoard);
    DOM.chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });
}

// Room Rendering Engine
function renderRoomsList() {
    DOM.roomsContainer.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
        const totalUsers = state.roomsData[i].spectatorsCount + 2; // Players + Spectators
        const btn = document.createElement('button');
        btn.className = `room-btn ${state.currentRoom === i ? 'active' : ''}`;
        btn.innerHTML = `<span>Room ${i}</span> <small>👥 ${totalUsers}</small>`;
        btn.onclick = () => switchRoom(i);
        DOM.roomsContainer.appendChild(btn);
    }
}

function switchRoom(roomNum) {
    state.currentRoom = roomNum;
    DOM.roomTitle.textContent = `Room ${roomNum}`;
    const currentRoomData = state.roomsData[roomNum];
    DOM.roomOccupancy.textContent = `Users: ${currentRoomData.spectatorsCount + 2}`;
    
    renderRoomsList();
    renderChatHistory();
}

// Game Rules Matrix Logic
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
    DOM.cells[index].classList.add(player.toLowerCase());
}

function executeAIMove() {
    if (!state.isGameActive || state.isPaused) return;
    const availableIndices = state.board.map((val, idx) => val === '' ? idx : null).filter(v => v !== null);
    
    if (availableIndices.length > 0) {
        const strategicChoice = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        executeMove(strategicChoice, 'O');
        
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

    // Flashing banner notification setup
    DOM.winBanner.classList.remove('hidden');
    setTimeout(() => { DOM.winBanner.classList.add('hidden'); }, 4000);
}

// Operational Core Toggles
function toggleGameMode() {
    state.isSinglePlayer = !state.isSinglePlayer;
    DOM.modeToggle.textContent = state.isSinglePlayer ? "Switch to 2-Player Mode" : "Switch to Single Player";
    
    if (state.isSinglePlayer) {
        DOM.pauseBtn.classList.remove('hidden');
    } else {
        DOM.pauseBtn.classList.add('hidden');
        state.isPaused = false;
        DOM.pauseBtn.textContent = "Pause Game";
    }
    resetBoard();
}

function togglePause() {
    if (!state.isSinglePlayer) return;
    state.isPaused = !state.isPaused;
    DOM.pauseBtn.textContent = state.isPaused ? "Resume Game" : "Pause Game";
    DOM.gameStatus.textContent = state.isPaused ? "Game Paused" : `Player ${state.currentTurn}'s Turn`;
}

function resetBoard() {
    state.board = Array(9).fill('');
    state.isGameActive = true;
    state.currentTurn = 'X';
    DOM.gameStatus.textContent = "Player X's Turn";
    DOM.cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
}

// Shared Room Chat Pipeline Elements
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

function sendChatMessage() {
    if (state.chatBlocked) return;
    const value = DOM.chatInput.value.trim();
    if (!value) return;

    // Incremental index names based on spectator counts
    const spectatorId = `Spectator ${state.roomsData[state.currentRoom].spectatorsCount + 1}`;
    state.roomsData[state.currentRoom].messages.push({ user: spectatorId, text: value });
    
    DOM.chatInput.value = '';
    renderChatHistory();
}

function toggleChatBlock() {
    state.chatBlocked = !state.chatBlocked;
    if (state.chatBlocked) {
        DOM.btnBlockChat.textContent = "Unblock Chat";
        DOM.btnBlockChat.classList.add('active');
        DOM.chatMessages.classList.add('chat-blocked');
        DOM.chatInput.disabled = true;
        DOM.btnSendChat.disabled = true;
    } else {
        DOM.btnBlockChat.textContent = "Block Chat";
        DOM.btnBlockChat.classList.remove('active');
        DOM.chatMessages.classList.remove('chat-blocked');
        DOM.chatInput.disabled = false;
        DOM.btnSendChat.disabled = false;
    }
}

// Start core system process routines
init();
