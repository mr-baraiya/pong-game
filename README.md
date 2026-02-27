# Battle Pong

War-themed Pong game with AI opponent, high scores, and responsive design.

## Play Online

- https://pong-game.tech/
- https://pong-game-8ad96.web.app/
- https://pong-game-8ad96.firebaseapp.com/

## Features

- Single player vs AI or 2-player mode
- Three difficulty levels
- Global leaderboard with Firebase
- Mobile and desktop controls
- Canvas-based rendering with trail effects

## Controls

**Desktop:**
- Player 1: W/S or Arrow keys (vs AI)
- Player 2: Arrow Up/Down (2-player mode)
- Space: Start/Pause

**Mobile:**
- Touch buttons for both players

## Quick Start

```bash
git clone https://github.com/mr-baraiya/pong-game.git
cd pong-game
python3 -m http.server 8080
```

Open http://localhost:8080 in your browser.

## Firebase Setup (Optional)

Works without Firebase in demo mode. For high scores and analytics:

1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database and Analytics
3. Copy `src/config/firebase.config.template.js` to `src/config/firebase.config.js`
4. Add your Firebase credentials to `firebase.config.js`
5. Deploy rules: `firebase deploy --only firestore:rules`

## Tech Stack

- HTML5 Canvas
- JavaScript ES6
- Bootstrap 5.3
- Lucide Icons
- Firebase (Firestore, Analytics, Hosting)

## Structure

```
src/
├── css/styles.css
├── js/game.js
└── config/
    ├── firebase.js
    ├── firebase.config.template.js
    └── environment.js
```

## License

MIT License - see LICENSE file for details