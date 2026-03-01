# Multiplayer Pong - Deployment Guide

This guide explains how to deploy your Battle Pong game with real-time multiplayer on Firebase + External Server.

## Architecture

- **Frontend (Static)**: Firebase Hosting (HTML, CSS, JS)
- **Backend (Node.js)**: Render/Railway/Glitch (Socket.io server)

## What You Need

1. Firebase account (free)
2. Render/Railway/Glitch account (free tier available)
3. Node.js installed locally (for testing)

## Deployment Steps

### Step 1: Deploy Backend Server (Multiplayer)

#### Option A: Deploy to Render (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Click "Create Web Service"
7. **Copy the deployed URL** (e.g., `https://your-app.onrender.com`)

#### Option B: Deploy to Railway

1. Go to [Railway.app](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys
5. **Copy the deployed URL**

#### Option C: Deploy to Glitch

1. Go to [Glitch.com](https://glitch.com/)
2. Click "New Project" → "Import from GitHub"
3. Enter your repository URL
4. Glitch will auto-deploy
5. **Copy the project URL**

### Step 2: Update Socket.io Server URL

1. Open `/src/js/multiplayer.js`
2. Find line 8:
```javascript
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-multiplayer-server.onrender.com'; // Update this
```
3. Replace `https://your-multiplayer-server.onrender.com` with your actual deployed backend URL
4. Save and commit the change

### Step 3: Deploy Frontend to Firebase

1. **Install Firebase CLI** (if not already):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Deploy**:
```bash
firebase deploy
```

4. Your game will be live at your Firebase Hosting URL!

## 🎮 Testing Locally

### Start Backend Server:
```bash
npm install
npm start
```
Server runs on http://localhost:3000

### Access Game:
Open `index.html` in browser or use:
```bash
python3 -m http.server 8080
```
Then visit http://localhost:8080

## How to Play Multiplayer

1. Open your game (Firebase URL)
2. Select **"Online Multiplayer"** from Game Mode
3. Choose:
   - **Quick Match**: Automatically find an opponent
   - **Create Private Room**: Get a 6-character room code to share
   - **Join Room**: Enter a friend's room code

## Environment Variables (Optional)

For the backend server, you can set:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: `production` for production mode

On Render/Railway, these are typically auto-configured.

## Troubleshooting

### Multiplayer not connecting:
1. Check that backend server is running
2. Verify the SOCKET_SERVER_URL in multiplayer.js
3. Check browser console for errors
4. Ensure server allows WebSocket connections

### Firebase deployment fails:
```bash
firebase login --reauth
firebase deploy --only hosting
```

### Can't find opponent for Quick Match:
- Quick match requires 2 players searching simultaneously
- Use Private Room instead to play with a specific friend

## Features

✅ Real-time multiplayer across different devices
✅ Room system with unique 6-character codes
✅ Quick match for instant play
✅ Server-authoritative game logic (prevents cheating)
✅ 60 FPS synchronization
✅ Reconnection support  
✅ Works alongside existing single-player modes

## URLs After Deployment

- **Frontend**: `https://your-project.web.app` (Firebase)
- **Backend API**: `https://your-app.onrender.com` (Render)
- **Health Check**: `https://your-app.onrender.com/health`

## Tips

- Free tier servers may sleep after inactivity - first connection might take 30-60 seconds
- For better performance, upgrade to paid hosting tier
- Monitor server logs for debugging: `firebase functions:log` or check Render logs
- Test multiplayer with 2 different browsers/devices locally first

---

Need help? Check the server logs or open an issue on GitHub!
