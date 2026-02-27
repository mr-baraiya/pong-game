// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Import Firebase configuration (kept in separate file for security)
import { firebaseConfig, isFirebaseEnabled } from './environment.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
let db = null;

if (isFirebaseEnabled) {
    try {
        analytics = getAnalytics(app);
        db = getFirestore(app);
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
} else {
    console.log('Running in demo mode - Firebase features disabled');
}

// Firebase Analytics Events
export const trackGameStart = (difficulty) => {
    if (!analytics || !isFirebaseEnabled) {
        console.log('Demo mode: Game start tracked locally', { difficulty });
        return;
    }
    
    try {
        logEvent(analytics, 'game_start', {
            difficulty: difficulty,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.warn('Failed to track game start:', error);
    }
};

export const trackGameEnd = (winner, score1, score2, gameTime) => {
    if (!analytics || !isFirebaseEnabled) {
        console.log('Demo mode: Game end tracked locally', { winner, score1, score2, gameTime });
        return;
    }
    
    try {
        logEvent(analytics, 'game_end', {
            winner: winner,
            player1_score: score1,
            player2_score: score2,
            game_duration: gameTime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.warn('Failed to track game end:', error);
    }
};

export const trackScore = (player, currentScore) => {
    if (!analytics || !isFirebaseEnabled) {
        console.log('Demo mode: Score tracked locally', { player, currentScore });
        return;
    }
    
    try {
        logEvent(analytics, 'score_point', {
            player: player,
            score: currentScore,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.warn('Failed to track score:', error);
    }
};

// Firestore Functions for High Scores
export const saveScore = async (playerName, score, gameTime, difficulty) => {
    if (!db || !isFirebaseEnabled) {
        console.log('Demo mode: Score saved locally', { playerName, score, gameTime, difficulty });
        // Simulate successful save in demo mode
        return 'demo-id-' + Date.now();
    }
    
    try {
        const docRef = await addDoc(collection(db, 'scores'), {
            playerName: playerName,
            score: score,
            gameTime: gameTime,
            difficulty: difficulty,
            timestamp: new Date(),
            createdAt: new Date().toISOString()
        });
        console.log('Score saved with ID: ', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding score: ', error);
        throw error;
    }
};

export const getTopScores = async (limitCount = 10) => {
    if (!db || !isFirebaseEnabled) {
        console.log('Demo mode: Returning mock high scores');
        // Return demo high scores
        return [
            { id: '1', playerName: 'Demo Player', score: 15, gameTime: 180, difficulty: 'normal', timestamp: new Date(), createdAt: new Date().toISOString() },
            { id: '2', playerName: 'Test User', score: 12, gameTime: 200, difficulty: 'hard', timestamp: new Date(), createdAt: new Date().toISOString() },
            { id: '3', playerName: 'Sample Gamer', score: 10, gameTime: 150, difficulty: 'easy', timestamp: new Date(), createdAt: new Date().toISOString() }
        ];
    }
    
    try {
        const q = query(
            collection(db, 'scores'), 
            orderBy('score', 'desc'),
            orderBy('gameTime', 'asc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return scores;
    } catch (error) {
        console.error('Error getting scores: ', error);
        throw error;
    }
};

export const getScoresByDifficulty = async (difficulty, limitCount = 5) => {
    if (!db || !isFirebaseEnabled) {
        console.log('Demo mode: Returning mock scores by difficulty', difficulty);
        // Return demo scores filtered by difficulty
        const demoScores = [
            { id: '1', playerName: 'Demo Player', score: 15, gameTime: 180, difficulty: 'normal', timestamp: new Date(), createdAt: new Date().toISOString() },
            { id: '2', playerName: 'Test User', score: 12, gameTime: 200, difficulty: 'hard', timestamp: new Date(), createdAt: new Date().toISOString() },
            { id: '3', playerName: 'Sample Gamer', score: 10, gameTime: 150, difficulty: 'easy', timestamp: new Date(), createdAt: new Date().toISOString() }
        ];
        return demoScores.filter(score => score.difficulty === difficulty);
    }
    
    try {
        const q = query(
            collection(db, 'scores'),
            where('difficulty', '==', difficulty),
            orderBy('score', 'desc'),
            orderBy('gameTime', 'asc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        const scores = [];
        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return scores;
    } catch (error) {
        console.error('Error getting scores by difficulty: ', error);
        throw error;
    }
};

// Initialize Firebase app
export { app, analytics, db, isFirebaseEnabled };