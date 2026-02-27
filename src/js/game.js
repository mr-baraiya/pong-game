// Yuddha Pong - Indian War Themed Pong Game
// Import Firebase functions
import { trackGameStart, trackGameEnd, trackScore, saveScore, getTopScores } from '../config/firebase.js';

class YuddhaPong {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStarted = false;
        
        // Game objects
        this.leftPaddle = null;
        this.rightPaddle = null;
        this.ball = null;
        
        // Game settings
        this.difficulty = 'normal';
        this.paddleSpeed = 8;
        this.ballSpeed = 5;
        this.maxBallSpeed = 12;
        
        // Score and stats
        this.scores = { player1: 0, player2: 0 };
        this.stats = {
            gameTime: 0,
            rallyCount: 0,
            currentRally: 0,
            longestRally: 0,
            startTime: null
        };
        
        // High scores
        this.highScores = [];
        this.playerName = '';
        this.showingHighScores = false;
        
        // Controls
        this.keys = {
            w: false, s: false,
            up: false, down: false,
            space: false
        };
        
        // Mobile touch controls
        this.mobileControls = {
            leftUp: false, leftDown: false,
            rightUp: false, rightDown: false
        };
        
        // Battle messages
        this.battleMessages = [
            "Epic clash of players!",
            "Perfect defense move!", 
            "Shield defense successful!",
            "Lightning fast strike!",
            "Fierce game continues!",
            "Powerful counter-attack!",
            "Great paddle control!",
            "Player shows supremacy!",
            "Badhiya rally chal raha hai!",
            "Kamaal ka shot!",
            "Defense mast hai!",
            "Speed badh rahi hai!"
        ];
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createGameObjects();
        this.setupEventListeners();
        this.updateDisplay();
        this.loadHighScores();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Calculate dimensions based on container and screen size
        const maxWidth = Math.min(containerRect.width - 40, window.innerWidth * 0.8);
        const maxHeight = Math.min(window.innerHeight * 0.6, 500);
        
        // Maintain 4:3 aspect ratio
        const aspectRatio = 4 / 3;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update canvas style for responsiveness
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
    }
    
    createGameObjects() {
        const paddleWidth = 15;
        const paddleHeight = this.canvas.height * 0.2;
        const ballSize = 12;
        
        this.leftPaddle = {
            x: 30,
            y: this.canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: this.paddleSpeed,
            color: '#FF9933'
        };
        
        this.rightPaddle = {
            x: this.canvas.width - 30 - paddleWidth,
            y: this.canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: this.paddleSpeed,
            color: '#FFD700',
            ai: true
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: ballSize,
            speedX: 0,
            speedY: 0,
            color: '#B22222',
            trail: []
        };
        
        this.resetBall();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Random direction
        const direction = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() - 0.5) * Math.PI / 3; // ±30 degrees
        
        this.ball.speedX = Math.cos(angle) * this.ballSpeed * direction;
        this.ball.speedY = Math.sin(angle) * this.ballSpeed;
        this.ball.trail = [];
        
        this.stats.currentRally = 0;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('overlayBtn').addEventListener('click', () => this.continueGame());
        
        // Mobile controls
        document.getElementById('mobileStartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mobilePauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('mobileResetBtn').addEventListener('click', () => this.resetGame());
        
        // Mobile paddle controls
        this.setupMobileControls();
        
        // Difficulty selector
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });
    }
    
    setupMobileControls() {
        const mobileButtons = {
            leftUp: document.getElementById('leftUp'),
            leftDown: document.getElementById('leftDown'),
            rightUp: document.getElementById('rightUp'),
            rightDown: document.getElementById('rightDown')
        };
        
        Object.keys(mobileButtons).forEach(key => {
            const button = mobileButtons[key];
            if (button) {
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.mobileControls[key] = true;
                    button.classList.add('active');
                });
                
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.mobileControls[key] = false;
                    button.classList.remove('active');
                });
                
                // Mouse events for desktop testing
                button.addEventListener('mousedown', () => {
                    this.mobileControls[key] = true;
                    button.classList.add('active');
                });
                
                button.addEventListener('mouseup', () => {
                    this.mobileControls[key] = false;
                    button.classList.remove('active');
                });
            }
        });
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'KeyW': this.keys.w = true; break;
            case 'KeyS': this.keys.s = true; break;
            case 'ArrowUp': this.keys.up = true; e.preventDefault(); break;
            case 'ArrowDown': this.keys.down = true; e.preventDefault(); break;
            case 'Space': 
                e.preventDefault();
                if (!this.keys.space) {
                    this.keys.space = true;
                    this.pauseGame();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.code) {
            case 'KeyW': this.keys.w = false; break;
            case 'KeyS': this.keys.s = false; break;
            case 'ArrowUp': this.keys.up = false; break;
            case 'ArrowDown': this.keys.down = false; break;
            case 'Space': this.keys.space = false; break;
        }
    }
    
    setDifficulty(level) {
        this.difficulty = level;
        switch(level) {
            case 'easy':
                this.paddleSpeed = 6;
                this.ballSpeed = 3;
                this.maxBallSpeed = 8;
                break;
            case 'normal':
                this.paddleSpeed = 8;
                this.ballSpeed = 5;
                this.maxBallSpeed = 12;
                break;
            case 'hard':
                this.paddleSpeed = 10;
                this.ballSpeed = 7;
                this.maxBallSpeed = 15;
                break;
        }
        
        if (this.leftPaddle) {
            this.leftPaddle.speed = this.paddleSpeed;
            this.rightPaddle.speed = this.paddleSpeed;
        }
    }
    
    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.stats.startTime = Date.now();
            this.addBattleLog("Game started! Players ready!");
            
            // Track game start in Firebase Analytics
            try {
                trackGameStart(this.difficulty);
            } catch (error) {
                console.log('Analytics tracking failed:', error);
            }
        }
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.hideOverlay();
        
        if (this.ball.speedX === 0 && this.ball.speedY === 0) {
            this.resetBall();
        }
    }
    
    pauseGame() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            if (this.gamePaused) {
                this.showOverlay("GAME PAUSED", "Take a moment to strategize...", false);
            } else {
                this.hideOverlay();
            }
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStarted = false;
        this.scores = { player1: 0, player2: 0 };
        this.stats = {
            gameTime: 0,
            rallyCount: 0,
            currentRally: 0,
            longestRally: 0,
            startTime: null
        };
        
        this.createGameObjects();
        this.updateDisplay();
        this.clearBattleLog();
        this.addBattleLog("Players prepare for a new game!");
        this.showOverlay("PRESS START TO BEGIN GAME", "Get ready to play, gamers!", false);
    }
    
    continueGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.hideOverlay();
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateStats();
    }
    
    updatePaddles() {
        // Left paddle (Player 1)
        if (this.keys.w || this.mobileControls.leftUp) {
            this.leftPaddle.y -= this.leftPaddle.speed;
        }
        if (this.keys.s || this.mobileControls.leftDown) {
            this.leftPaddle.y += this.leftPaddle.speed;
        }
        
        // Right paddle (Player 2 or AI)
        if (this.rightPaddle.ai) {
            // AI Logic
            const paddleCenter = this.rightPaddle.y + this.rightPaddle.height / 2;
            const ballY = this.ball.y;
            
            let aiSpeed = this.rightPaddle.speed;
            if (this.difficulty === 'easy') aiSpeed *= 0.7;
            if (this.difficulty === 'hard') aiSpeed *= 1.3;
            
            // Add some randomness for more realistic AI
            const randomFactor = (Math.random() - 0.5) * 2;
            
            if (paddleCenter < ballY - 10 + randomFactor) {
                this.rightPaddle.y += aiSpeed;
            } else if (paddleCenter > ballY + 10 + randomFactor) {
                this.rightPaddle.y -= aiSpeed;
            }
        } else {
            // Player 2 controls
            if (this.keys.up || this.mobileControls.rightUp) {
                this.rightPaddle.y -= this.rightPaddle.speed;
            }
            if (this.keys.down || this.mobileControls.rightDown) {
                this.rightPaddle.y += this.rightPaddle.speed;
            }
        }
        
        // Keep paddles in bounds
        this.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.leftPaddle.height, this.leftPaddle.y));
        this.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.rightPaddle.height, this.rightPaddle.y));
    }
    
    updateBall() {
        // Store previous position for trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) {
            this.ball.trail.shift();
        }
        
        // Move ball
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Top and bottom wall collision
        if (this.ball.y <= this.ball.size / 2 || this.ball.y >= this.canvas.height - this.ball.size / 2) {
            this.ball.speedY = -this.ball.speedY;
            this.ball.y = Math.max(this.ball.size / 2, Math.min(this.canvas.height - this.ball.size / 2, this.ball.y));
        }
        
        // Paddle collision
        this.checkPaddleCollision();
        
        // Score detection
        if (this.ball.x < 0) {
            this.scores.player2++;
            this.addBattleLog(`Player 2 scores! Total: ${this.scores.player2}`);
            
            // Track score in Firebase Analytics
            try {
                trackScore('player2', this.scores.player2);
            } catch (error) {
                console.log('Analytics tracking failed:', error);
            }
            
            this.resetBall();
            this.checkGameEnd();
        } else if (this.ball.x > this.canvas.width) {
            this.scores.player1++;
            this.addBattleLog(`Player 1 scores! Total: ${this.scores.player1}`);
            
            // Track score in Firebase Analytics
            try {
                trackScore('player1', this.scores.player1);
            } catch (error) {
                console.log('Analytics tracking failed:', error);
            }
            
            this.resetBall();
            this.checkGameEnd();
        }
    }
    
    checkPaddleCollision() {
        // Left paddle collision
        if (this.ball.x - this.ball.size / 2 <= this.leftPaddle.x + this.leftPaddle.width &&
            this.ball.x + this.ball.size / 2 >= this.leftPaddle.x &&
            this.ball.y >= this.leftPaddle.y &&
            this.ball.y <= this.leftPaddle.y + this.leftPaddle.height &&
            this.ball.speedX < 0) {
            
            this.handlePaddleCollision(this.leftPaddle, true);
        }
        
        // Right paddle collision
        if (this.ball.x + this.ball.size / 2 >= this.rightPaddle.x &&
            this.ball.x - this.ball.size / 2 <= this.rightPaddle.x + this.rightPaddle.width &&
            this.ball.y >= this.rightPaddle.y &&
            this.ball.y <= this.rightPaddle.y + this.rightPaddle.height &&
            this.ball.speedX > 0) {
            
            this.handlePaddleCollision(this.rightPaddle, false);
        }
    }
    
    handlePaddleCollision(paddle, isLeftPaddle) {
        // Calculate collision point
        const collisionPoint = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        
        // Calculate new angle based on collision point
        const maxAngle = Math.PI / 3; // 60 degrees
        const angle = collisionPoint * maxAngle;
        
        // Calculate new speed
        const speed = Math.min(
            Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY) + 0.5,
            this.maxBallSpeed
        );
        
        // Set new velocity
        this.ball.speedX = Math.cos(angle) * speed * (isLeftPaddle ? 1 : -1);
        this.ball.speedY = Math.sin(angle) * speed;
        
        // Move ball away from paddle to prevent sticking
        if (isLeftPaddle) {
            this.ball.x = paddle.x + paddle.width + this.ball.size / 2;
        } else {
            this.ball.x = paddle.x - this.ball.size / 2;
        }
        
        // Update rally count
        this.stats.currentRally++;
        this.stats.longestRally = Math.max(this.stats.longestRally, this.stats.currentRally);
        
        // Add battle message
        const randomMessage = this.battleMessages[Math.floor(Math.random() * this.battleMessages.length)];
        this.addBattleLog(randomMessage);
    }
    
    checkGameEnd() {
        const winScore = 7;
        if (this.scores.player1 >= winScore || this.scores.player2 >= winScore) {
            const winner = this.scores.player1 >= winScore ? "PLAYER 1" : "PLAYER 2";
            const winnerScore = this.scores.player1 >= winScore ? this.scores.player1 : this.scores.player2;
            const gameTime = this.stats.gameTime;
            
            this.gameRunning = false;
            
            // Track game end in Firebase Analytics
            try {
                trackGameEnd(winner, this.scores.player1, this.scores.player2, gameTime);
            } catch (error) {
                console.log('Analytics tracking failed:', error);
            }
            
            this.showVictoryScreen(winner, winnerScore, gameTime);
            this.addBattleLog(`${winner} emerges victorious! Final score: ${this.scores.player1}-${this.scores.player2}`);
        }
    }
    
    updateStats() {
        if (this.stats.startTime) {
            this.stats.gameTime = Math.floor((Date.now() - this.stats.startTime) / 1000);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game background
        this.drawBackground();
        
        // Draw game objects
        this.drawPaddle(this.leftPaddle);
        this.drawPaddle(this.rightPaddle);
        this.drawBall();
        
        // Draw center line
        this.drawCenterLine();
    }
    
    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, 'rgba(26, 15, 10, 0.3)');
        gradient.addColorStop(0.5, 'rgba(178, 34, 34, 0.1)');
        gradient.addColorStop(1, 'rgba(26, 15, 10, 0.3)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawPaddle(paddle) {
        // Paddle glow effect
        this.ctx.shadowColor = paddle.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = paddle.color;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Paddle border
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
    
    drawBall() {
        // Ball trail effect
        this.ball.trail.forEach((point, index) => {
            const alpha = (index + 1) / this.ball.trail.length * 0.5;
            this.ctx.fillStyle = `rgba(178, 34, 34, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.ball.size / 2 * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Main ball with glow
        this.ctx.shadowColor = this.ball.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball border
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawCenterLine() {
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = 'rgba(255, 153, 51, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    updateDisplay() {
        // Update scores
        document.getElementById('player1Score').textContent = this.scores.player1;
        document.getElementById('player2Score').textContent = this.scores.player2;
        
        // Update stats
        const minutes = Math.floor(this.stats.gameTime / 60);
        const seconds = this.stats.gameTime % 60;
        document.getElementById('gameTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('ballSpeed').textContent = 
            Math.round(Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY));
        
        document.getElementById('rallyCount').textContent = this.stats.currentRally;
        document.getElementById('longestRally').textContent = this.stats.longestRally;
    }
    
    showOverlay(title, message, showButton) {
        const overlay = document.getElementById('gameOverlay');
        const titleEl = document.getElementById('overlayTitle');
        const messageEl = document.getElementById('overlayMessage');
        const buttonEl = document.getElementById('overlayBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        buttonEl.style.display = showButton ? 'block' : 'none';
        overlay.style.display = 'block';
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').style.display = 'none';
    }
    
    addBattleLog(message) {
        const logContainer = document.getElementById('battleLog');
        const logEntry = document.createElement('small');
        logEntry.className = 'text-light d-block';
        logEntry.textContent = message;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 10 messages
        const messages = logContainer.children;
        if (messages.length > 10) {
            logContainer.removeChild(messages[0]);
        }
    }
    
    clearBattleLog() {
        document.getElementById('battleLog').innerHTML = '';
    }
    
    // Firebase Integration Methods
    async loadHighScores() {
        try {
            this.highScores = await getTopScores(10);
            this.updateHighScoresDisplay();
        } catch (error) {
            console.log('Failed to load high scores:', error);
            this.highScores = [];
        }
    }
    
    async saveHighScore(playerName, score, gameTime, difficulty) {
        try {
            await saveScore(playerName, score, gameTime, difficulty);
            await this.loadHighScores(); // Refresh the high scores
            this.addBattleLog(`High score saved for ${playerName}!`);
        } catch (error) {
            console.log('Failed to save high score:', error);
            this.addBattleLog('Failed to save high score to server');
        }
    }
    
    showVictoryScreen(winner, score, gameTime) {
        const isHighScore = this.isHighScore(score);
        
        if (isHighScore) {
            this.promptForPlayerName(winner, score, gameTime);
        } else {
            this.showOverlay(`${winner} WINS THE GAME!`, `Victory achieved through skill! Score: ${score}`, true);
        }
    }
    
    isHighScore(score) {
        if (this.highScores.length < 10) return true;
        return score > this.highScores[this.highScores.length - 1].score;
    }
    
    promptForPlayerName(winner, score, gameTime) {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">🏆 NEW HIGH SCORE! 🏆</h2>
            <p class="text-light mb-3">${winner} achieved a high score of ${score}!</p>
            <div class="mb-3">
                <input type="text" id="playerNameInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Enter your name" maxlength="20">
            </div>
            <div class="d-flex gap-2 justify-content-center">
                <button id="saveScoreBtn" class="btn btn-warning">Save Score</button>
                <button id="skipScoreBtn" class="btn btn-outline-warning">Skip</button>
            </div>
        `;
        
        overlay.style.display = 'block';
        
        const saveBtn = document.getElementById('saveScoreBtn');
        const skipBtn = document.getElementById('skipScoreBtn');
        const nameInput = document.getElementById('playerNameInput');
        
        nameInput.focus();
        
        const handleSave = async () => {
            const playerName = nameInput.value.trim() || 'Anonymous';
            await this.saveHighScore(playerName, score, gameTime, this.difficulty);
            this.showHighScoresList();
        };
        
        const handleSkip = () => {
            this.showOverlay(`${winner} WINS THE GAME!`, `Victory achieved through skill! Score: ${score}`, true);
        };
        
        saveBtn.addEventListener('click', handleSave);
        skipBtn.addEventListener('click', handleSkip);
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        });
    }
    
    showHighScoresList() {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        let scoresHTML = '<h2 class="text-warning mb-3">🏆 HIGH SCORES</h2>';
        
        if (this.highScores.length === 0) {
            scoresHTML += '<p class="text-light">No high scores yet!</p>';
        } else {
            scoresHTML += '<div class="high-scores-list text-start">';
            this.highScores.forEach((score, index) => {
                const date = new Date(score.timestamp).toLocaleDateString();
                const minutes = Math.floor(score.gameTime / 60);
                const seconds = score.gameTime % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                scoresHTML += `
                    <div class="score-entry mb-2 p-2 border border-warning rounded">
                        <div class="d-flex justify-content-between">
                            <span class="text-warning fw-bold">#${index + 1} ${score.playerName}</span>
                            <span class="text-light">${score.score} pts</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small class="text-warning">${score.difficulty} • ${timeStr}</small>
                            <small class="text-light">${date}</small>
                        </div>
                    </div>
                `;
            });
            scoresHTML += '</div>';
        }
        
        scoresHTML += '<button id="closeHighScores" class="btn btn-warning mt-3">Continue</button>';
        
        content.innerHTML = scoresHTML;
        overlay.style.display = 'block';
        
        document.getElementById('closeHighScores').addEventListener('click', () => {
            this.hideOverlay();
        });
    }
    
    updateHighScoresDisplay() {
        // Could be used to update a sidebar or other UI element with high scores
        // For now, we'll just log them
        console.log('High scores updated:', this.highScores);
    }
    
    gameLoop() {
        this.update();
        this.render();
        this.updateDisplay();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new YuddhaPong();
    window.game = game; // For debugging
});

// Handle page visibility for auto-pause
document.addEventListener('visibilitychange', () => {
    if (window.game && document.hidden && window.game.gameRunning && !window.game.gamePaused) {
        window.game.pauseGame();
    }
});