// Local Multiplayer Configuration Override (optional)
// This file is not tracked by git - safe for local testing
// Copy this to multiplayer.config.local.js and edit as needed

window.MULTIPLAYER_CONFIG = {
    // Override server URL for local development
    serverURL: 'http://localhost:3000',
    
    // Or use a different staging server
    // serverURL: 'https://your-staging-server.onrender.com',
    
    // Connection settings
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
};

console.log('Local config override active:', window.MULTIPLAYER_CONFIG.serverURL);
