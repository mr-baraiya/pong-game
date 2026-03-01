# Multiplayer Server Configuration

## Current Server URL
Your multiplayer server is deployed at: **https://pong-game-mfy2.onrender.com**

## Configuration System

The game uses a flexible 3-tier configuration:

1. **Local Override** (highest priority) - For development/testing
2. **Default Config** - Production server URL
3. **Auto-detect** - Localhost for local development

## How to Change Server URL

### Option 1: Production Config (Firebase Deployment)
Edit `/src/config/multiplayer.config.js`:
```javascript
window.MULTIPLAYER_CONFIG = {
    serverURL: 'https://pong-game-mfy2.onrender.com', // Your production server
};
```
Then deploy: `firebase deploy --only hosting`

### Option 2: Local Development Override
For testing with a different server without changing production config:

1. Copy the example file:
```bash
cp src/config/multiplayer.config.local.example.js src/config/multiplayer.config.local.js
```

2. Edit `multiplayer.config.local.js`:
```javascript
window.MULTIPLAYER_CONFIG = {
    serverURL: 'http://localhost:3000', // Or your staging server
};
```

3. This file is ignored by git - safe for local testing!

### Option 3: Auto-Detection (No Config Needed)
If you don't create a local override:
- **On localhost**: Automatically uses `http://localhost:3000`
- **On production**: Uses the configured server URL

## Quick Start

### 1. Deploy Backend to Render
```bash
# Push code to GitHub
git add .
git commit -m "Add multiplayer"
git push

# Render will auto-deploy from GitHub
# Get URL: https://pong-game-mfy2.onrender.com
```

### 2. Update Config (if URL changed)
Edit `src/config/multiplayer.config.js` with your new Render URL

### 3. Deploy Frontend to Firebase
```bash
firebase deploy --only hosting
```

Done! Your game is live with multiplayer! 🚀

## Testing

1. **Local Testing**:
   - Start server: `npm start`
   - Open: http://localhost:3000
   - Auto-uses localhost URL

2. **Production Testing**:
   - Visit your Firebase URL
   - Auto-uses Render server URL
   - Check browser console for connection status

## Server Endpoints

- **Health Check**: https://pong-game-mfy2.onrender.com/health
- **WebSocket**: wss://pong-game-mfy2.onrender.com

## Troubleshooting

### Cannot connect to server
1. Check server status: `curl https://pong-game-mfy2.onrender.com/health`
2. Verify URL in `multiplayer.config.js`
3. Check browser console for errors

### CORS errors
- Render servers should handle CORS automatically
- If issues persist, check server.js CORS configuration

---

**Quick Deploy**: Just run `firebase deploy` - the server URL is already configured! 🚀
