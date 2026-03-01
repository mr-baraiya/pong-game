const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 12;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 15;
const FPS = 60;
const WINNING_SCORE = 7;

// Store active game rooms
const gameRooms = new Map();
const waitingPlayers = new Map(); // Players waiting for match

class MultiplayerRoom {
    constructor(roomId, player1Id) {
        this.roomId = roomId;
        this.players = {
            player1: { id: player1Id, ready: true, connected: true },
            player2: null
        };
        this.gameState = {
            ball: {
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 2,
                speedX: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
                speedY: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
                speed: INITIAL_BALL_SPEED
            },
            paddles: {
                left: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
                right: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 }
            },
            scores: { player1: 0, player2: 0 },
            gameStarted: false,
            gameOver: false,
            winner: null,
            rallies: 0,
            currentRally: 0
        };
        this.gameLoop = null;
        this.lastUpdate = Date.now();
    }

    addPlayer2(player2Id) {
        this.players.player2 = { id: player2Id, ready: true, connected: true };
        this.startGame();
    }

    startGame() {
        if (this.gameLoop) return;
        
        this.gameState.gameStarted = true;
        this.gameState.gameOver = false;
        this.lastUpdate = Date.now();
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.broadcast();
        }, 1000 / FPS);
    }

    update() {
        if (!this.gameState.gameStarted || this.gameState.gameOver) return;

        // Update ball position
        this.gameState.ball.x += this.gameState.ball.speedX;
        this.gameState.ball.y += this.gameState.ball.speedY;

        // Ball collision with top and bottom walls
        if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= GAME_HEIGHT - BALL_SIZE) {
            this.gameState.ball.speedY *= -1;
            this.gameState.ball.y = Math.max(0, Math.min(GAME_HEIGHT - BALL_SIZE, this.gameState.ball.y));
        }

        // Ball collision with paddles
        const leftPaddle = this.gameState.paddles.left;
        const rightPaddle = this.gameState.paddles.right;

        // Left paddle collision
        if (this.gameState.ball.x <= 30 + PADDLE_WIDTH &&
            this.gameState.ball.speedX < 0 &&
            this.gameState.ball.y + BALL_SIZE >= leftPaddle.y &&
            this.gameState.ball.y <= leftPaddle.y + PADDLE_HEIGHT) {
            
            this.handlePaddleCollision('left');
        }

        // Right paddle collision
        if (this.gameState.ball.x >= GAME_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE &&
            this.gameState.ball.speedX > 0 &&
            this.gameState.ball.y + BALL_SIZE >= rightPaddle.y &&
            this.gameState.ball.y <= rightPaddle.y + PADDLE_HEIGHT) {
            
            this.handlePaddleCollision('right');
        }

        // Ball out of bounds (scoring)
        if (this.gameState.ball.x < 0) {
            this.score('player2');
        } else if (this.gameState.ball.x > GAME_WIDTH) {
            this.score('player1');
        }
    }

    handlePaddleCollision(side) {
        this.gameState.ball.speedX *= -1.05; // Slight speed increase
        
        const paddle = this.gameState.paddles[side];
        const relativeIntersectY = (paddle.y + PADDLE_HEIGHT / 2) - (this.gameState.ball.y + BALL_SIZE / 2);
        const normalizedIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
        const bounceAngle = normalizedIntersectionY * (Math.PI / 4);
        
        this.gameState.ball.speed = Math.min(Math.abs(this.gameState.ball.speedX), MAX_BALL_SPEED);
        
        const direction = side === 'left' ? 1 : -1;
        this.gameState.ball.speedX = direction * this.gameState.ball.speed * Math.cos(bounceAngle);
        this.gameState.ball.speedY = this.gameState.ball.speed * -Math.sin(bounceAngle);

        // Prevent stuck ball
        if (side === 'left') {
            this.gameState.ball.x = 30 + PADDLE_WIDTH;
        } else {
            this.gameState.ball.x = GAME_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE;
        }

        this.gameState.currentRally++;
    }

    score(scorer) {
        this.gameState.scores[scorer]++;
        this.gameState.rallies++;
        this.gameState.currentRally = 0;
        
        if (this.gameState.scores[scorer] >= WINNING_SCORE) {
            this.endGame(scorer);
        } else {
            this.resetBall();
        }
    }

    resetBall() {
        this.gameState.ball = {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            speedX: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            speedY: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            speed: INITIAL_BALL_SPEED
        };
    }

    endGame(winner) {
        this.gameState.gameOver = true;
        this.gameState.winner = winner;
        this.pauseGame();
    }

    pauseGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
            this.gameState.gameStarted = false;
        }
    }

    movePaddle(playerNum, direction) {
        const paddle = playerNum === 1 ? this.gameState.paddles.left : this.gameState.paddles.right;
        
        if (direction === 'up') {
            paddle.y = Math.max(0, paddle.y - PADDLE_SPEED);
        } else if (direction === 'down') {
            paddle.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, paddle.y + PADDLE_SPEED);
        }
    }

    broadcast() {
        if (this.players.player1) {
            io.to(this.players.player1.id).emit('multiplayerUpdate', this.gameState);
        }
        if (this.players.player2) {
            io.to(this.players.player2.id).emit('multiplayerUpdate', this.gameState);
        }
    }

    disconnect(socketId) {
        if (this.players.player1?.id === socketId) {
            this.players.player1.connected = false;
        }
        if (this.players.player2?.id === socketId) {
            this.players.player2.connected = false;
        }
        this.pauseGame();
    }

    cleanup() {
        this.pauseGame();
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Quick match - find or create a game
    socket.on('quickMatch', () => {
        // Check if there's a waiting player
        let foundRoom = null;
        
        for (let [roomId, room] of gameRooms.entries()) {
            if (!room.players.player2 && room.players.player1.id !== socket.id) {
                foundRoom = { roomId, room };
                break;
            }
        }

        if (foundRoom) {
            // Join existing room
            const { roomId, room } = foundRoom;
            room.addPlayer2(socket.id);
            socket.roomId = roomId;
            socket.playerNum = 2;
            
            socket.emit('multiplayerJoined', {
                roomId,
                playerNum: 2,
                gameConfig: { width: GAME_WIDTH, height: GAME_HEIGHT }
            });
            
            io.to(room.players.player1.id).emit('opponentJoined', { playerNum: 2 });
            io.to(socket.id).emit('opponentJoined', { playerNum: 1 });
            
            console.log(`Player ${socket.id} joined room ${roomId}`);
        } else {
            // Create new room
            const roomId = uuidv4().substring(0, 6).toUpperCase();
            const room = new MultiplayerRoom(roomId, socket.id);
            gameRooms.set(roomId, room);
            socket.roomId = roomId;
            socket.playerNum = 1;
            
            socket.emit('multiplayerJoined', {
                roomId,
                playerNum: 1,
                gameConfig: { width: GAME_WIDTH, height: GAME_HEIGHT }
            });
            
            socket.emit('waitingForOpponent');
            console.log(`Room created: ${roomId}, waiting for player 2`);
        }
    });

    // Join specific room
    socket.on('joinRoom', (roomId) => {
        const room = gameRooms.get(roomId);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.players.player2) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        room.addPlayer2(socket.id);
        socket.roomId = roomId;
        socket.playerNum = 2;
        
        socket.emit('multiplayerJoined', {
            roomId,
            playerNum: 2,
            gameConfig: { width: GAME_WIDTH, height: GAME_HEIGHT }
        });
        
        io.to(room.players.player1.id).emit('opponentJoined', { playerNum: 2 });
        io.to(socket.id).emit('opponentJoined', { playerNum: 1 });
        
        console.log(`Player ${socket.id} joined room ${roomId}`);
    });

    // Create private room
    socket.on('createRoom', () => {
        const roomId = uuidv4().substring(0, 6).toUpperCase();
        const room = new MultiplayerRoom(roomId, socket.id);
        gameRooms.set(roomId, room);
        socket.roomId = roomId;
        socket.playerNum = 1;
        
        socket.emit('multiplayerJoined', {
            roomId,
            playerNum: 1,
            gameConfig: { width: GAME_WIDTH, height: GAME_HEIGHT }
        });
        
        socket.emit('waitingForOpponent');
        console.log(`Private room created: ${roomId}`);
    });

    // Paddle movement
    socket.on('paddleMove', (data) => {
        const room = gameRooms.get(socket.roomId);
        if (room && socket.playerNum) {
            room.movePaddle(socket.playerNum, data.direction);
        }
    });

    // Restart game
    socket.on('restartMultiplayer', () => {
        const room = gameRooms.get(socket.roomId);
        if (room) {
            room.gameState.scores = { player1: 0, player2: 0 };
            room.gameState.rallies = 0;
            room.gameState.currentRally = 0;
            room.gameState.gameOver = false;
            room.gameState.winner = null;
            room.resetBall();
            room.startGame();
            room.broadcast();
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
                room.disconnect(socket.id);
                
                // Notify other player
                const otherPlayerId = room.players.player1?.id === socket.id 
                    ? room.players.player2?.id 
                    : room.players.player1?.id;
                    
                if (otherPlayerId) {
                    io.to(otherPlayerId).emit('opponentDisconnected');
                }
                
                // Clean up room after 2 minutes
                setTimeout(() => {
                    if (room && !room.players.player1?.connected && !room.players.player2?.connected) {
                        room.cleanup();
                        gameRooms.delete(socket.roomId);
                        console.log(`Room cleaned up: ${socket.roomId}`);
                    }
                }, 2 * 60 * 1000);
            }
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', activeRooms: gameRooms.size });
});

// Start server
server.listen(PORT, () => {
    console.log(`🎮 Multiplayer Pong Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play`);
});
