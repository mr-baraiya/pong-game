# Battle Pong - Indian War Themed Pong Game

An epic battle-themed Pong game inspired by Indian warfare, featuring responsive design with Bootstrap, Lucide icons, Firebase integration, and immersive visual effects.

## 🎮 Game Features

### ⚔️ Core Gameplay
- Classic Pong mechanics with Indian war theme
- Two-player mode with AI opponent
- Three difficulty levels: Easy Mode, Normal Mode, Hard Mode
- Real-time score tracking and game statistics
- Dynamic ball physics with speed increases
- **🔥 NEW**: Firebase-powered high scores system
- **📊 NEW**: Game analytics and player statistics

### 🎨 Visual Design
- **Indian War Theme**: Saffron, gold, and deep red color scheme
- **Modern Icons**: Lucide icons throughout the interface
- **Animated Effects**: Glowing paddles, ball trails, and victory animations
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Bootstrap Integration**: Fully responsive design

### 🗂️ Project Structure
```
pong-game/
│
├── index.html                          # Main HTML file
├── package.json                       # Project configuration
├── firebase.json                      # Firebase hosting config
├── firestore.rules                    # Database security rules
├── firestore.indexes.json             # Database indexes
├── .gitignore                         # Git ignore rules
│
├── src/                               # Source files
│   ├── css/                           # Stylesheets
│   │   └── styles.css                 # Main game styles
│   ├── js/                            # JavaScript files
│   │   └── game.js                    # Main game logic
│   └── config/                        # Configuration files
│       ├── firebase.js                # Firebase functions
│       ├── firebase.config.template.js # Firebase config template
│       ├── firebase.config.js         # Your private config (gitignored)
│       └── environment.js             # Environment handling
│
└── assets/                            # Game assets (images, sounds, etc.)
```

## Game Features

### Core Gameplay
- Classic Pong mechanics with Indian war theme
- Two-player mode with AI opponent
- Three difficulty levels: Easy Mode, Normal Mode, Hard Mode
- Real-time score tracking and game statistics
- Dynamic ball physics with speed increases

### Visual Design
- **Indian War Theme**: Saffron, gold, and deep red color scheme
- **Modern Icons**: Lucide icons throughout the interface
- **Animated Effects**: Glowing paddles, ball trails, and victory animations
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Bootstrap Integration**: Fully responsive design

### Controls

#### Desktop Controls
- **Player 1 (Left Player)**: W/S keys
- **Player 2 (Right Player)**: Arrow Up/Down keys
- **Pause/Resume**: Spacebar
- **Game Controls**: Start, Pause, Reset buttons

#### Mobile Controls
- Touch-friendly button controls with Lucide icons
- Separate controls for both players
- Responsive mobile interface

### 🏆 High Scores System
- **Personal Bests**: Save your best scores with custom names
- **Global Leaderboard**: Compete with players worldwide
- **Difficulty Rankings**: Separate leaderboards for each difficulty
- **Game Statistics**: Track game time and performance metrics
- **Secure Storage**: Firebase Firestore with security rules

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Firebase features)
- Optional: Node.js for development

### Quick Start
1. Clone the repository
2. Open `index.html` in your web browser
3. The game runs in demo mode by default
4. Set up Firebase (optional) for full features
5. Choose your difficulty level and start playing!

### Development Setup
```bash
# Clone the repository
git clone https://github.com/mr-baraiya/pong-game.git
cd pong-game

# Start local development server
npm run dev
# or
python3 -m http.server 8080

# Open browser to http://localhost:8080
```

### 🔥 Firebase Setup (For Full Features)

**Important: The game works in demo mode without Firebase, but you'll miss high scores and analytics.**

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Analytics
5. Get your configuration from Project Settings

#### Step 2: Configure Credentials Securely
```bash
# Copy the template file
cp src/config/firebase.config.template.js src/config/firebase.config.js

# Edit the file with your Firebase credentials
# src/config/firebase.config.js
```

**Your `firebase.config.js` should look like:**
```javascript
export const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef",
    measurementId: "G-XXXXXXXXXX"
};
```

#### Step 3: Deploy Firebase Rules
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules
```

### Game Rules
- First player to reach 7 points wins
- Ball speed increases with each paddle hit
- Collision angle depends on where the ball hits the paddle
- Strategic positioning is key to victory

### 🔧 Firebase Setup (Optional)
To enable full Firebase features:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Analytics

2. **Configure Firebase**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

3. **Update Configuration**:
   - Update `src/config/firebase.js` with your project credentials
   - Deploy security rules: `firebase deploy --only firestore:rules`

4. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy
   ```

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Canvas for game rendering
- **CSS3**: Advanced styling with gradients and animations
- **JavaScript (ES6+)**: Game logic and physics engine
- **Bootstrap 5.3**: Responsive framework
- **Lucide Icons**: Modern icon library
- **Google Fonts**: Indian-themed typography
- **Firebase**: Backend services
  - Firestore: NoSQL database for high scores
  - Analytics: Player behavior tracking
  - Hosting: Web hosting platform

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### 📦 Available Scripts
```bash
npm run dev        # Start development server
npm run serve      # Start production server
npm run deploy     # Deploy to Firebase
npm run firebase:init # Initialize Firebase
```

### 🔒 Security Features
- **Credential Protection**: Firebase credentials kept in gitignored files
- **Demo Mode**: Fully functional without Firebase setup
- **Firestore Security Rules**: Protect against unauthorized access
- **Input Validation**: Prevent invalid data submission
- **Rate Limiting**: Firebase security rules prevent spam
- **No Authentication Required**: Play without creating accounts

### 📊 Analytics Events Tracked
- Game starts and completions
- Score achievements
- Difficulty level selections
- Rally statistics
- Player engagement metrics

## 🎯 Game Mechanics

### Paddle Physics
- Collision detection based on ball position
- Dynamic angle calculation for realistic bounces
- Speed multiplication on paddle hits

### AI Behavior
- Intelligent opponent movement
- Difficulty-based reaction speed
- Realistic imperfection for engaging gameplay

### Responsive Design
- Automatic canvas resizing
- Mobile-optimized controls
- Bootstrap grid system integration
- Touch event handling

## Victory Conditions
- Score 7 points to win the game
- Victory screen with celebration
- Game statistics summary
- Option to start new game

## Customization

### Difficulty Settings
- **Easy Mode**: Slower ball and paddle speeds
- **Normal Mode**: Balanced gameplay (default)
- **Hard Mode**: Fast-paced intense games

### Theme Elements
- Traditional Indian color palette
- Modern Lucide icons throughout
- Game-themed messaging
- Cultural references

## Mobile Experience
- Optimized touch controls with Lucide icons
- Responsive canvas sizing
- Mobile-friendly button layout
- Portrait and landscape support

## Visual Effects
- Glowing paddle effects
- Ball trail animation
- Victory pulse effects
- Dynamic background gradients
- Animated game messages

---

**Get ready to play! May the best player emerge victorious in this epic Battle Pong challenge!**

*Created with modern web technologies and responsive design*