// Multiplayer functionality for Battle Pong
// This module handles online multiplayer using Socket.io

// Socket.io server URL configuration
// Priority: 1. Environment config, 2. Production URL, 3. Localhost
const getServerURL = () => {
    // Check if environment config exists
    if (typeof window !== 'undefined' && window.MULTIPLAYER_CONFIG) {
        return window.MULTIPLAYER_CONFIG.serverURL;
    }
    
    // Auto-detect environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Production server URL
    return 'https://pong-game-mfy2.onrender.com';
};

const SOCKET_SERVER_URL = getServerURL();

class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomId = null;
        this.playerNum = null;
        this.isMultiplayerMode = false;
        this.waitingForOpponent = false;
        this.opponentConnected = false;
    }

    init() {
        // Load Socket.io client dynamically
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
            script.onload = () => this.connectToServer();
            document.head.appendChild(script);
        } else {
            this.connectToServer();
        }
    }

    connectToServer() {
        try {
            this.socket = io(SOCKET_SERVER_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.setupSocketListeners();
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
            this.showError('Cannot connect to multiplayer server. Please try again later.');
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
            if (this.isMultiplayerMode) {
                this.showError('Disconnected from server');
            }
        });

        this.socket.on('multiplayerJoined', (data) => {
            this.roomId = data.roomId;
            this.playerNum = data.playerNum;
            this.isMultiplayerMode = true;
            
            console.log(`Joined room ${this.roomId} as Player ${this.playerNum}`);
            
            if (this.playerNum === 1) {
                this.waitingForOpponent = true;
                this.showWaitingScreen();
                this.updateStartButton('waiting');
            } else {
                this.updateStartButton('ready');
            }
        });

        this.socket.on('waitingForOpponent', () => {
            this.waitingForOpponent = true;
            this.showWaitingScreen();
            this.updateStartButton('waiting');
        });

        this.socket.on('opponentJoined', (data) => {
            this.waitingForOpponent = false;
            this.opponentConnected = true;
            this.hideWaitingScreen();
            this.updateStartButton('ready');
            this.game.addBattleLog('Opponent joined! Game starting...');
            this.game.audioManager.playSound('rally');
            
            // Start the game
            if (!this.game.gameRunning) {
                this.game.startGame();
            }
        });

        this.socket.on('multiplayerUpdate', (gameState) => {
            if (!this.isMultiplayerMode) return;
            
            // Update game state from server
            this.game.ball.x = gameState.ball.x;
            this.game.ball.y = gameState.ball.y;
            this.game.ball.speedX = gameState.ball.speedX;
            this.game.ball.speedY = gameState.ball.speedY;
            
            // Update opponent's paddle
            if (this.playerNum === 1) {
                this.game.rightPaddle.y = gameState.paddles.right.y;
            } else {
                this.game.leftPaddle.y = gameState.paddles.left.y;
            }
            
            // Update scores
            this.game.scores.player1 = gameState.scores.player1;
            this.game.scores.player2 = gameState.scores.player2;
            this.game.stats.rallyCount = gameState.rallies;
            this.game.stats.currentRally = gameState.currentRally;
            
            // Check for game over
            if (gameState.gameOver && this.game.gameRunning) {
                const winner = gameState.winner === 'player1' ? 'PLAYER 1' : 'PLAYER 2';
                this.game.endGame(winner);
            }
        });

        this.socket.on('opponentDisconnected', () => {
            this.opponentConnected = false;
            this.showError('Opponent disconnected');
            this.game.pauseGame();
        });

        this.socket.on('error', (data) => {
            this.showError(data.message);
        });
    }

    quickMatch() {
        if (!this.connected) {
            this.showError('Not connected to server. Connecting...');
            this.init();
            setTimeout(() => this.quickMatch(), 1000);
            return;
        }

        this.socket.emit('quickMatch');
        this.game.addBattleLog('Searching for opponent...');
    }

    createPrivateRoom() {
        if (!this.connected) {
            this.showError('Not connected to server. Connecting...');
            this.init();
            setTimeout(() => this.createPrivateRoom(), 1000);
            return;
        }

        this.socket.emit('createRoom');
        this.game.addBattleLog('Creating private room...');
    }

    joinRoom(roomId) {
        if (!this.connected) {
            this.showError('Not connected to server. Connecting...');
            this.init();
            setTimeout(() => this.joinRoom(roomId), 1000);
            return;
        }

        if (!roomId || roomId.length !== 6) {
            this.showError('Invalid room ID. Must be 6 characters.');
            return;
        }

        this.socket.emit('joinRoom', roomId.toUpperCase());
        this.game.addBattleLog(`Joining room ${roomId}...`);
    }

    sendPaddleMove(direction) {
        if (this.socket && this.connected && this.isMultiplayerMode) {
            this.socket.emit('paddleMove', { direction });
        }
    }

    restartGame() {
        if (this.socket && this.connected && this.isMultiplayerMode) {
            this.socket.emit('restartMultiplayer');
        }
    }

    showWaitingScreen() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const btn = document.getElementById('overlayBtn');
        
        overlay.style.display = 'flex';
        title.textContent = 'WAITING FOR OPPONENT';
        message.innerHTML = `
            <div class="text-center">
                <p>Room ID: <strong class="text-warning">${this.roomId}</strong></p>
                <p class="small">Share this ID with your friend to join!</p>
                <button class="btn btn-sm btn-outline-warning" onclick="navigator.clipboard.writeText('${this.roomId}')">
                    <i data-lucide="copy"></i> Copy Room ID
                </button>
            </div>
        `;
        btn.style.display = 'none';
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    hideWaitingScreen() {
        const overlay = document.getElementById('gameOverlay');
        overlay.style.display = 'none';
    }

    showError(message) {
        this.game.addBattleLog(`⚠️ ${message}`);
        
        // Also show a toast notification if available
        const toast = document.createElement('div');
        toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }

    leaveMultiplayer() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isMultiplayerMode = false;
        this.waitingForOpponent = false;
        this.opponentConnected = false;
        this.roomId = null;
        this.playerNum = null;
        this.hideWaitingScreen();
        
        // Reset start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.innerHTML = '<i data-lucide="play"></i> START GAME';
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    updateMyPaddle() {
        // Send only my paddle position to reduce data
        if (!this.game.gameRunning || !this.isMultiplayerMode) return;
        
        const myPaddle = this.playerNum === 1 ? this.game.leftPaddle : this.game.rightPaddle;
        
        // Determine movement direction
        if (this.playerNum === 1) {
            if (this.game.keys.w && !this.game.keys.s) {
                this.sendPaddleMove('up');
            } else if (this.game.keys.s && !this.game.keys.w) {
                this.sendPaddleMove('down');
            }
        } else {
            if (this.game.keys.up && !this.game.keys.down) {
                this.sendPaddleMove('up');
            } else if (this.game.keys.down && !this.game.keys.up) {
                this.sendPaddleMove('down');
            }
        }
    }

    updateStartButton(state) {
        const startBtn = document.getElementById('startBtn');
        if (!startBtn) return;
        
        switch (state) {
            case 'waiting':
                startBtn.innerHTML = '<i data-lucide="clock"></i> WAITING FOR OPPONENT';
                startBtn.disabled = true;
                startBtn.classList.add('opacity-50');
                break;
            case 'ready':
                startBtn.innerHTML = '<i data-lucide="play"></i> START GAME';
                startBtn.disabled = false;
                startBtn.classList.remove('opacity-50');
                break;
            case 'playing':
                startBtn.innerHTML = '<i data-lucide="play"></i> PLAYING';
                startBtn.disabled = true;
                break;
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Make available globally for ES6 modules
if (typeof window !== 'undefined') {
    window.MultiplayerManager = MultiplayerManager;
}

// Also export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerManager;
}
