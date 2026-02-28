// Yuddha Pong - Indian War Themed Pong Game
// Import Firebase functions
import { 
    trackGameStart, 
    trackGameEnd, 
    trackScore, 
    saveScore, 
    getTopScores, 
    signInWithGoogle, 
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signOutUser, 
    onAuthStateChange, 
    getCurrentUser 
} from '../config/firebase.js';

// Import Audio Manager
import { AudioManager } from './audio.js';

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
        this.gameMode = 'ai';
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
        this.currentPage = 1;
        this.scoresPerPage = 10;
        
        // User authentication
        this.currentUser = null;
        
        // Audio Manager
        this.audioManager = new AudioManager();
        
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
        this.setupAuth();
        this.updatePlayerLabels();
        this.updateDisplay();
        this.loadHighScores();
        this.updateAudioButton();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const canvasWrapper = this.canvas.parentElement;
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        
        // Calculate dimensions based on available space in wrapper
        const maxWidth = Math.floor(wrapperRect.width - 10);
        const maxHeight = Math.floor(wrapperRect.height - 10);
        
        // Check if mobile view
        const isMobile = window.innerWidth <= 768;
        
        // Use different aspect ratios for mobile vs desktop
        // On mobile, use a more vertical aspect ratio for better use of vertical space
        const aspectRatio = isMobile ? 0.65 : 1.33; // mobile: width/height ratio (narrower), desktop: 4/3
        
        let width, height;
        
        if (isMobile) {
            // On mobile, prioritize using available height
            height = maxHeight;
            width = Math.floor(height * aspectRatio);
            
            // If width exceeds available space, scale down
            if (width > maxWidth) {
                width = maxWidth;
                height = Math.floor(width / aspectRatio);
            }
        } else {
            // On desktop, prioritize width
            width = maxWidth;
            height = Math.floor(width / aspectRatio);
            
            // If height exceeds available space, scale down
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.floor(height * aspectRatio);
            }
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update canvas style for responsiveness
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.maxHeight = '100%';
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
            ai: this.gameMode === 'ai'
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
        document.getElementById('audioBtn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('overlayBtn').addEventListener('click', () => {
            // If game is not started or not running, reset the game
            // Otherwise, continue (unpause)
            if (!this.gameStarted || !this.gameRunning) {
                this.resetGame();
            } else {
                this.continueGame();
            }
        });
        
        // Mobile controls
        document.getElementById('mobileStartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mobilePauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('mobileResetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('mobileAudioBtn').addEventListener('click', () => this.toggleAudio());
        
        // Mobile paddle controls
        this.setupMobileControls();
        
        // Game mode selector
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.setGameMode(e.target.value);
        });
        
        // Difficulty selector
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });
        
        // High scores button
        const highScoresBtn = document.getElementById('highScoresBtn');
        if (highScoresBtn) {
            highScoresBtn.addEventListener('click', () => this.showHighScoresList());
        }
    }
    
    setupAuth() {
        // Set up authentication UI event listeners
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const viewProfileBtn = document.getElementById('viewProfileBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserProfile();
            });
        }
        
        // Listen for auth state changes
        onAuthStateChange((user) => {
            this.currentUser = user;
            this.updateAuthUI(user);
        });
    }
    
    async handleLogin() {
        this.showAuthModal();
    }
    
    showAuthModal(mode = 'signin') {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        const signInForm = mode === 'signin' ? `
            <h2 class="text-warning mb-3">🎮 Sign In</h2>
            <p class="text-light mb-3">Sign in to save your high scores</p>
            
            <!-- Social Sign-In -->
            <div class="d-grid gap-2 mb-3">
                <button id="googleSignInBtn" class="btn btn-outline-warning">
                    <i data-lucide="chrome"></i> Continue with Google
                </button>
                <button id="githubSignInBtn" class="btn btn-outline-warning">
                    <i data-lucide="github"></i> Continue with GitHub
                </button>
            </div>
            
            <div class="text-center text-warning my-3">OR</div>
            
            <!-- Email Sign-In Form -->
            <div class="mb-3">
                <input type="email" id="emailInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" id="passwordInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Password" required>
            </div>
            
            <div class="d-grid gap-2 mb-3">
                <button id="emailSignInBtn" class="btn btn-warning">Sign In</button>
            </div>
            
            <div class="text-center">
                <small class="text-light">
                    <a href="#" id="forgotPasswordLink" class="text-warning">Forgot Password?</a>
                </small>
            </div>
            
            <div class="text-center mt-3">
                <small class="text-light">
                    Don't have an account? 
                    <a href="#" id="showSignUpLink" class="text-warning">Sign Up</a>
                </small>
            </div>
            
            <div class="text-center mt-3">
                <button id="closeAuthModal" class="btn btn-sm btn-outline-warning">Continue as Guest</button>
            </div>
        ` : mode === 'signup' ? `
            <h2 class="text-warning mb-3">🎮 Create Account</h2>
            <p class="text-light mb-3">Join the Battle Pong arena!</p>
            
            <div class="mb-3">
                <input type="text" id="displayNameInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Display Name" required>
            </div>
            <div class="mb-3">
                <input type="email" id="emailInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" id="passwordInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Password (min 6 characters)" required>
            </div>
            
            <div class="d-grid gap-2 mb-3">
                <button id="emailSignUpBtn" class="btn btn-warning">Create Account</button>
            </div>
            
            <div class="text-center mt-3">
                <small class="text-light">
                    Already have an account? 
                    <a href="#" id="showSignInLink" class="text-warning">Sign In</a>
                </small>
            </div>
            
            <div class="text-center mt-3">
                <button id="closeAuthModal" class="btn btn-sm btn-outline-warning">Continue as Guest</button>
            </div>
        ` : `
            <h2 class="text-warning mb-3">🔑 Reset Password</h2>
            <p class="text-light mb-3">Enter your email to receive a password reset link</p>
            
            <div class="mb-3">
                <input type="email" id="resetEmailInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Email" required>
            </div>
            
            <div class="d-grid gap-2 mb-3">
                <button id="sendResetBtn" class="btn btn-warning">Send Reset Link</button>
            </div>
            
            <div class="text-center mt-3">
                <small class="text-light">
                    <a href="#" id="backToSignInLink" class="text-warning">Back to Sign In</a>
                </small>
            </div>
        `;
        
        content.innerHTML = signInForm;
        overlay.style.display = 'block';
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Add event listeners based on mode
        if (mode === 'signin') {
            this.setupSignInListeners();
        } else if (mode === 'signup') {
            this.setupSignUpListeners();
        } else if (mode === 'reset') {
            this.setupResetPasswordListeners();
        }
        
        // Close modal listener
        const closeBtn = document.getElementById('closeAuthModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideOverlay());
        }
    }
    
    setupSignInListeners() {
        // Google Sign-In
        const googleBtn = document.getElementById('googleSignInBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    const result = await signInWithGoogle();
                    this.hideOverlay();
                    this.addBattleLog(`Welcome, ${result.user.displayName}!`);
                } catch (error) {
                    this.handleAuthError(error);
                }
            });
        }
        
        // GitHub Sign-In
        const githubBtn = document.getElementById('githubSignInBtn');
        if (githubBtn) {
            githubBtn.addEventListener('click', async () => {
                try {
                    const result = await signInWithGithub();
                    this.hideOverlay();
                    this.addBattleLog(`Welcome, ${result.user.displayName || result.user.email}!`);
                } catch (error) {
                    this.handleAuthError(error);
                }
            });
        }
        
        // Email Sign-In
        const emailBtn = document.getElementById('emailSignInBtn');
        if (emailBtn) {
            emailBtn.addEventListener('click', async () => {
                const email = document.getElementById('emailInput').value;
                const password = document.getElementById('passwordInput').value;
                
                if (!email || !password) {
                    this.addBattleLog('Please enter email and password');
                    return;
                }
                
                try {
                    const result = await signInWithEmail(email, password);
                    this.hideOverlay();
                    this.addBattleLog(`Welcome back, ${result.user.displayName || result.user.email}!`);
                } catch (error) {
                    this.handleAuthError(error);
                }
            });
        }
        
        // Forgot Password Link
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthModal('reset');
            });
        }
        
        // Show Sign Up Link
        const signUpLink = document.getElementById('showSignUpLink');
        if (signUpLink) {
            signUpLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthModal('signup');
            });
        }
    }
    
    setupSignUpListeners() {
        const signUpBtn = document.getElementById('emailSignUpBtn');
        if (signUpBtn) {
            signUpBtn.addEventListener('click', async () => {
                const displayName = document.getElementById('displayNameInput').value;
                const email = document.getElementById('emailInput').value;
                const password = document.getElementById('passwordInput').value;
                
                if (!displayName || !email || !password) {
                    this.addBattleLog('Please fill all fields');
                    return;
                }
                
                try {
                    const result = await signUpWithEmail(email, password, displayName);
                    this.hideOverlay();
                    this.addBattleLog(`Welcome to Battle Pong, ${displayName}!`);
                } catch (error) {
                    this.handleAuthError(error);
                }
            });
        }
        
        const signInLink = document.getElementById('showSignInLink');
        if (signInLink) {
            signInLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthModal('signin');
            });
        }
    }
    
    setupResetPasswordListeners() {
        const resetBtn = document.getElementById('sendResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const email = document.getElementById('resetEmailInput').value;
                
                if (!email) {
                    this.addBattleLog('Please enter your email');
                    return;
                }
                
                try {
                    await resetPassword(email);
                    this.hideOverlay();
                    this.showPasswordResetConfirmation(email);
                } catch (error) {
                    this.handleAuthError(error);
                }
            });
        }
        
        const backLink = document.getElementById('backToSignInLink');
        if (backLink) {
            backLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthModal('signin');
            });
        }
    }
    
    showPasswordResetConfirmation(email) {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">✅ Email Sent!</h2>
            <p class="text-light mb-3">Password reset link has been sent to:</p>
            <p class="text-warning mb-3">${email}</p>
            <p class="text-light small mb-3">Please check your inbox and follow the instructions to reset your password.</p>
            <button id="closeResetConfirmation" class="btn btn-warning">OK</button>
        `;
        
        overlay.style.display = 'block';
        
        document.getElementById('closeResetConfirmation').addEventListener('click', () => {
            this.hideOverlay();
        });
    }
    
    handleAuthError(error) {
        // Log simplified message for expected configuration issues
        if (error.code === 'auth/not-configured' || error.code === 'auth/cancelled') {
            console.info('Auth issue:', error.message);
        } else {
            console.warn('Auth failed:', error.code || error.message);
        }
        
        // Show user-friendly error message based on error type
        if (error.code === 'auth/not-configured') {
            this.showAuthConfigurationError();
        } else if (error.code === 'auth/cancelled') {
            this.addBattleLog('Sign-in cancelled');
        } else if (error.code === 'auth/unauthorized-domain') {
            this.showDomainAuthorizationError(error.domain || window.location.hostname);
        } else if (error.code === 'auth/domain-error') {
            this.showDomainAuthorizationError(window.location.hostname);
        } else if (error.code === 'auth/email-exists') {
            this.addBattleLog('Email already registered. Please sign in.');
        } else if (error.code === 'auth/weak-password') {
            this.addBattleLog('Password too weak. Use at least 6 characters.');
        } else if (error.code === 'auth/wrong-password') {
            this.addBattleLog('Incorrect password. Try again.');
        } else if (error.code === 'auth/user-not-found') {
            this.addBattleLog('No account found. Please sign up.');
        } else if (error.code === 'auth/invalid-email') {
            this.addBattleLog('Invalid email address.');
        } else if (error.code === 'auth/account-exists') {
            this.addBattleLog('Account exists with different provider.');
        } else {
            this.addBattleLog('Authentication failed. Please try again.');
        }
    }
    
    showAuthConfigurationError(customMessage) {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        const message = customMessage || 'Google Sign-In is not configured yet';
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">⚠️ Authentication Not Available</h2>
            <p class="text-light mb-3">${message}</p>
            <div class="text-start bg-dark p-3 rounded border border-warning mb-3">
                <p class="text-warning mb-2"><strong>To enable Google Sign-In:</strong></p>
                <ol class="text-light small">
                    <li>Go to Firebase Console</li>
                    <li>Select Authentication → Sign-in method</li>
                    <li>Enable Google provider</li>
                    <li>Add authorized domains</li>
                </ol>
            </div>
            <p class="text-light small mb-3">You can still play the game and save scores with a custom name.</p>
            <button id="closeAuthError" class="btn btn-warning">Continue Playing</button>
        `;
        
        overlay.style.display = 'block';
        
        document.getElementById('closeAuthError').addEventListener('click', () => {
            this.hideOverlay();
        });
    }
    
    showDomainAuthorizationError(domain) {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">🔒 Domain Not Authorized</h2>
            <p class="text-light mb-3">OAuth sign-in is not enabled for this domain.</p>
            
            <div class="text-start bg-dark p-3 rounded border border-warning mb-3">
                <p class="text-warning mb-2"><strong>Current domain:</strong></p>
                <code class="text-light d-block mb-3 p-2 bg-darker rounded" style="word-break: break-all;">${domain}</code>
                
                <p class="text-warning mb-2"><strong>To fix this:</strong></p>
                <ol class="text-light small mb-0">
                    <li>Open <a href="https://console.firebase.google.com" target="_blank" class="text-warning">Firebase Console</a></li>
                    <li>Go to <strong>Authentication</strong> → <strong>Settings</strong></li>
                    <li>Click <strong>Authorized domains</strong> tab</li>
                    <li>Click <strong>Add domain</strong></li>
                    <li>Enter: <code class="text-warning">${domain}</code></li>
                    <li>Click <strong>Add</strong> and try again</li>
                </ol>
            </div>
            
            <div class="alert alert-info bg-dark border-warning p-2 mb-3">
                <small class="text-light">
                    <strong>Note:</strong> Email/Password sign-in still works! Only Google and GitHub require domain authorization.
                </small>
            </div>
            
            <button id="closeDomainError" class="btn btn-warning">Use Email Sign-In Instead</button>
        `;
        
        overlay.style.display = 'block';
        
        document.getElementById('closeDomainError').addEventListener('click', () => {
            this.hideOverlay();
            // Show sign-in modal again
            setTimeout(() => this.showAuthModal('signin'), 300);
        });
    }
    
    async handleLogout() {
        try {
            await signOutUser();
            this.currentUser = null;
            this.addBattleLog('Signed out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
    
    updateAuthUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userPhoto = document.getElementById('userPhoto');
        
        if (user) {
            // User is signed in
            loginBtn.classList.add('d-none');
            userInfo.classList.remove('d-none');
            
            if (userName) {
                userName.textContent = user.displayName || 'User';
            }
            
            if (userPhoto && user.photoURL) {
                userPhoto.src = user.photoURL;
                userPhoto.style.display = 'block';
            }
            
            // Auto-fill player name if needed
            this.playerName = user.displayName || '';
        } else {
            // User is signed out
            loginBtn.classList.remove('d-none');
            userInfo.classList.add('d-none');
            this.playerName = '';
        }
    }
    
    showUserProfile() {
        if (!this.currentUser) return;
        
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">👤 User Profile</h2>
            <div class="text-center mb-3">
                ${this.currentUser.photoURL ? `<img src="${this.currentUser.photoURL}" alt="Profile" class="rounded-circle mb-2" style="width: 80px; height: 80px; border: 3px solid var(--war-gold);">` : ''}
                <h4 class="text-light">${this.currentUser.displayName || 'User'}</h4>
                <p class="text-warning">${this.currentUser.email || ''}</p>
            </div>
            <button id="closeProfile" class="btn btn-warning mt-3">Close</button>
        `;
        
        overlay.style.display = 'block';
        
        document.getElementById('closeProfile').addEventListener('click', () => {
            this.hideOverlay();
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
                    // If game hasn't started yet, start it
                    if (!this.gameStarted) {
                        this.startGame();
                    } 
                    // If game is running, toggle pause
                    else if (this.gameStarted) {
                        this.pauseGame();
                    }
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
    
    setGameMode(mode) {
        this.gameMode = mode;
        if (this.rightPaddle) {
            this.rightPaddle.ai = (mode === 'ai');
        }
        this.updatePlayerLabels();
        this.addBattleLog(`Game mode: ${mode === 'ai' ? '1 Player vs AI' : '2 Players'}`);
    }
    
    updatePlayerLabels() {
        const player2Label = document.getElementById('player2Label');
        if (player2Label) {
            player2Label.textContent = this.gameMode === 'ai' ? 'AI' : 'PLAYER 2';
        }
        
        // Update mobile controls visibility
        const mobileP1Controls = document.getElementById('mobileP1Controls');
        const mobileP2Controls = document.getElementById('mobileP2Controls');
        
        if (this.gameMode === 'ai') {
            // In AI mode, P1 controls take full width, hide P2 controls
            if (mobileP1Controls) mobileP1Controls.className = 'col-12';
            if (mobileP2Controls) mobileP2Controls.style.display = 'none';
        } else {
            // In 2-player mode, show both controls side by side
            if (mobileP1Controls) mobileP1Controls.className = 'col-6';
            if (mobileP2Controls) {
                mobileP2Controls.style.display = '';
                mobileP2Controls.className = 'col-6';
            }
        }
    }
    
    getPlayer2Name() {
        return this.gameMode === 'ai' ? 'AI' : 'Player 2';
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
        // Initialize audio on first user interaction
        if (!this.audioManager.initialized) {
            this.audioManager.init();
        }
        
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.stats.startTime = Date.now();
            this.addBattleLog("Game started! Players ready!");
            
            // Play game start sound and music
            this.audioManager.playGameStart();
            this.audioManager.startMusic();
            
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
                this.showOverlay("GAME PAUSED", "Take a moment to strategize...", true, "RESUME");
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
        
        // Stop music when resetting
        this.audioManager.stopMusic();
        
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
    
    toggleAudio() {
        const isEnabled = this.audioManager.toggleAudio();
        this.updateAudioButton();
    }
    
    updateAudioButton() {
        const isEnabled = this.audioManager.isEnabled();
        const audioBtn = document.getElementById('audioBtn');
        const mobileAudioBtn = document.getElementById('mobileAudioBtn');
        
        if (isEnabled) {
            audioBtn.innerHTML = '<i data-lucide="volume-2" id="audioIcon"></i> AUDIO ON';
            mobileAudioBtn.innerHTML = '<i data-lucide="volume-2" id="mobileAudioIcon"></i> AUDIO';
            audioBtn.classList.remove('btn-outline-secondary');
            audioBtn.classList.add('btn-outline-warning');
            mobileAudioBtn.classList.remove('btn-outline-secondary');
            mobileAudioBtn.classList.add('btn-outline-warning');
        } else {
            audioBtn.innerHTML = '<i data-lucide="volume-x" id="audioIcon"></i> AUDIO OFF';
            mobileAudioBtn.innerHTML = '<i data-lucide="volume-x" id="mobileAudioIcon"></i> AUDIO';
            audioBtn.classList.remove('btn-outline-warning');
            audioBtn.classList.add('btn-outline-secondary');
            mobileAudioBtn.classList.remove('btn-outline-warning');
            mobileAudioBtn.classList.add('btn-outline-secondary');
        }
        
        // Refresh lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.updatePaddles();
        this.updateBall();
        this.updateStats();
    }
    
    updatePaddles() {
        // Left paddle (Player 1)
        // In AI mode, allow both W/S and Arrow keys for player 1
        if (this.rightPaddle.ai) {
            if (this.keys.w || this.keys.up || this.mobileControls.leftUp) {
                this.leftPaddle.y -= this.leftPaddle.speed;
            }
            if (this.keys.s || this.keys.down || this.mobileControls.leftDown) {
                this.leftPaddle.y += this.leftPaddle.speed;
            }
        } else {
            // In 2-player mode, only W/S for player 1
            if (this.keys.w || this.mobileControls.leftUp) {
                this.leftPaddle.y -= this.leftPaddle.speed;
            }
            if (this.keys.s || this.mobileControls.leftDown) {
                this.leftPaddle.y += this.leftPaddle.speed;
            }
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
            
            // Play wall hit sound
            this.audioManager.playWallHit();
        }
        
        // Paddle collision
        this.checkPaddleCollision();
        
        // Score detection
        if (this.ball.x < 0) {
            this.scores.player2++;
            this.addBattleLog(`${this.getPlayer2Name()} scores! Total: ${this.scores.player2}`);
            
            // Play score sound
            this.audioManager.playScore(false);
            
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
            
            // Play score sound
            this.audioManager.playScore(true);
            
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
        // Play paddle hit sound
        this.audioManager.playPaddleHit();
        
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
            const winner = this.scores.player1 >= winScore ? "PLAYER 1" : (this.gameMode === 'ai' ? "AI" : "PLAYER 2");
            const winnerScore = this.scores.player1 >= winScore ? this.scores.player1 : this.scores.player2;
            const gameTime = this.stats.gameTime;
            
            this.gameRunning = false;
            
            // Play game over sound and stop music
            this.audioManager.playGameOver();
            this.audioManager.stopMusic();
            
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
    
    showOverlay(title, message, showButton, buttonText = 'CONTINUE GAME') {
        const overlay = document.getElementById('gameOverlay');
        const titleEl = document.getElementById('overlayTitle');
        const messageEl = document.getElementById('overlayMessage');
        const buttonEl = document.getElementById('overlayBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        buttonEl.style.display = showButton ? 'block' : 'none';
        
        // Update button text if provided
        if (showButton) {
            const buttonTextContent = buttonEl.querySelector('i') ? ' ' + buttonText : buttonText;
            buttonEl.innerHTML = `<i data-lucide="play"></i>${buttonTextContent}`;
            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        overlay.style.display = 'block';
        
        // Blur any focused button to prevent accidental space key activation
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }
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
            this.highScores = await getTopScores(100); // Fetch more scores for pagination
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
            this.showOverlay(`${winner} WINS THE GAME!`, `Victory achieved through skill! Score: ${score}`, true, 'PLAY AGAIN');
        }
    }
    
    isHighScore(score) {
        if (this.highScores.length < 10) return true;
        return score > this.highScores[this.highScores.length - 1].score;
    }
    
    promptForPlayerName(winner, score, gameTime) {
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        // Get default name from logged-in user or empty
        const defaultName = this.currentUser ? this.currentUser.displayName : '';
        
        content.innerHTML = `
            <h2 class="text-warning mb-3">🏆 NEW HIGH SCORE! 🏆</h2>
            <p class="text-light mb-3">${winner} achieved a high score of ${score}!</p>
            ${this.currentUser ? `<p class="text-warning mb-2">Saving as: ${defaultName}</p>` : ''}
            <div class="mb-3 ${this.currentUser ? 'd-none' : ''}">
                <input type="text" id="playerNameInput" class="form-control bg-dark text-warning border-warning" 
                       placeholder="Enter your name" maxlength="20" value="${defaultName}">
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
        
        if (nameInput) {
            nameInput.focus();
        }
        
        const handleSave = async () => {
            let playerName;
            if (this.currentUser) {
                playerName = this.currentUser.displayName || 'Anonymous';
            } else {
                playerName = nameInput ? nameInput.value.trim() || 'Anonymous' : 'Anonymous';
            }
            await this.saveHighScore(playerName, score, gameTime, this.difficulty);
            this.showHighScoresList();
        };
        
        const handleSkip = () => {
            // Restore original overlay content
            content.innerHTML = `
                <h2 id="overlayTitle" class="text-warning mb-3">${winner} WINS THE GAME!</h2>
                <p id="overlayMessage" class="text-light mb-3">Victory achieved through skill! Final Score: ${score}</p>
                <button id="overlayBtn" class="btn btn-warning" style="display: block;"><i data-lucide="play"></i> PLAY AGAIN</button>
            `;
            // Reinitialize Lucide icons for the new content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            // Reattach event listener to the new button to reset the game
            const newOverlayBtn = document.getElementById('overlayBtn');
            if (newOverlayBtn) {
                newOverlayBtn.addEventListener('click', () => this.resetGame());
            }
        };
        
        saveBtn.addEventListener('click', handleSave);
        skipBtn.addEventListener('click', handleSkip);
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        });
    }
    
    showHighScoresList(page = 1) {
        this.currentPage = page;
        const overlay = document.getElementById('gameOverlay');
        const content = overlay.querySelector('.overlay-content');
        
        let scoresHTML = '<h2 class="text-warning mb-3">🏆 HIGH SCORES</h2>';
        
        if (this.highScores.length === 0) {
            scoresHTML += '<p class="text-light">No high scores yet!</p>';
        } else {
            // Calculate pagination
            const totalPages = Math.ceil(this.highScores.length / this.scoresPerPage);
            const startIndex = (this.currentPage - 1) * this.scoresPerPage;
            const endIndex = Math.min(startIndex + this.scoresPerPage, this.highScores.length);
            const paginatedScores = this.highScores.slice(startIndex, endIndex);
            
            // Display current page info
            scoresHTML += `<p class="text-center text-warning mb-2">Page ${this.currentPage} of ${totalPages}</p>`;
            
            scoresHTML += '<div class="high-scores-list text-start">';
            paginatedScores.forEach((score, index) => {
                const globalIndex = startIndex + index;
                const date = new Date(score.timestamp).toLocaleDateString();
                const minutes = Math.floor(score.gameTime / 60);
                const seconds = score.gameTime % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                scoresHTML += `
                    <div class="score-entry mb-2 p-2 border border-warning rounded">
                        <div class="d-flex justify-content-between">
                            <span class="text-warning fw-bold">#${globalIndex + 1} ${score.playerName}</span>
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
            
            // Add pagination controls if needed
            if (totalPages > 1) {
                scoresHTML += '<div class="pagination-controls d-flex justify-content-center align-items-center gap-2 mt-3 mb-2">';
                
                // Previous button
                if (this.currentPage > 1) {
                    scoresHTML += '<button id="prevPage" class="btn btn-sm btn-outline-warning"><i data-lucide="chevron-left"></i> Prev</button>';
                } else {
                    scoresHTML += '<button class="btn btn-sm btn-outline-warning" disabled><i data-lucide="chevron-left"></i> Prev</button>';
                }
                
                // Page numbers
                scoresHTML += `<span class="text-warning px-2">${this.currentPage} / ${totalPages}</span>`;
                
                // Next button
                if (this.currentPage < totalPages) {
                    scoresHTML += '<button id="nextPage" class="btn btn-sm btn-outline-warning">Next <i data-lucide="chevron-right"></i></button>';
                } else {
                    scoresHTML += '<button class="btn btn-sm btn-outline-warning" disabled>Next <i data-lucide="chevron-right"></i></button>';
                }
                
                scoresHTML += '</div>';
            }
        }
        
        scoresHTML += '<button id="closeHighScores" class="btn btn-warning mt-3">Continue</button>';
        
        content.innerHTML = scoresHTML;
        overlay.style.display = 'block';
        
        // Reinitialize Lucide icons for pagination buttons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Add event listeners
        document.getElementById('closeHighScores').addEventListener('click', () => {
            this.currentPage = 1; // Reset to first page
            this.hideOverlay();
        });
        
        // Pagination button listeners
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.showHighScoresList(this.currentPage - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.showHighScoresList(this.currentPage + 1);
            });
        }
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
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('PWA: Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('PWA: Service Worker registration failed:', error);
            });
    }
});

// Handle page visibility for auto-pause
document.addEventListener('visibilitychange', () => {
    if (window.game && document.hidden && window.game.gameRunning && !window.game.gamePaused) {
        window.game.pauseGame();
    }
});