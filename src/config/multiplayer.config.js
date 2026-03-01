// Multiplayer Server Configuration
// You can override this by creating multiplayer.config.local.js (not tracked by git)

window.MULTIPLAYER_CONFIG = {
    // Your deployed server URL
    serverURL: 'https://pong-game-mfy2.onrender.com',
    
    // Optional: Connection settings
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
};

console.log('✅ Multiplayer server configured:', window.MULTIPLAYER_CONFIG.serverURL);
