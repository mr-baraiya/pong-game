// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    GithubAuthProvider,
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Import Firebase configuration (kept in separate file for security)
import { firebaseConfig, isFirebaseEnabled } from './environment.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
let db = null;
let auth = null;
let authConfigured = false;

if (isFirebaseEnabled) {
    try {
        analytics = getAnalytics(app);
        db = getFirestore(app);
        auth = getAuth(app);
        authConfigured = true;
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
        authConfigured = false;
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
        // Check if player already exists in the leaderboard
        const existingScoreQuery = query(
            collection(db, 'scores'),
            where('playerName', '==', playerName)
        );
        const existingScores = await getDocs(existingScoreQuery);
        
        // Delete all existing scores for this player
        const deletePromises = [];
        existingScores.forEach((docSnapshot) => {
            const existingData = docSnapshot.data();
            const existingScore = existingData.score;
            const existingTime = existingData.gameTime;
            
            // Only keep the new score if it's better (higher score, or same score but faster time)
            const isNewScoreBetter = score > existingScore || (score === existingScore && gameTime < existingTime);
            
            if (isNewScoreBetter || existingScores.size > 1) {
                // Delete the old score(s)
                deletePromises.push(deleteDoc(doc(db, 'scores', docSnapshot.id)));
            }
        });
        
        await Promise.all(deletePromises);
        
        // Only add new score if it's better than existing or no existing score
        if (existingScores.size === 0 || deletePromises.length > 0) {
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
        } else {
            console.log('Existing score is better, not saving new score');
            return existingScores.docs[0].id;
        }
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
            orderBy('gameTime', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const allScores = [];
        querySnapshot.forEach((doc) => {
            allScores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Remove duplicates by keeping only the best score for each player
        const uniqueScores = [];
        const playersSeen = new Set();
        
        for (const score of allScores) {
            if (!playersSeen.has(score.playerName)) {
                playersSeen.add(score.playerName);
                uniqueScores.push(score);
                
                if (uniqueScores.length >= limitCount) {
                    break;
                }
            }
        }
        
        return uniqueScores;
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
            orderBy('gameTime', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const allScores = [];
        querySnapshot.forEach((doc) => {
            allScores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Remove duplicates by keeping only the best score for each player
        const uniqueScores = [];
        const playersSeen = new Set();
        
        for (const score of allScores) {
            if (!playersSeen.has(score.playerName)) {
                playersSeen.add(score.playerName);
                uniqueScores.push(score);
                
                if (uniqueScores.length >= limitCount) {
                    break;
                }
            }
        }
        
        return uniqueScores;
    } catch (error) {
        console.error('Error getting scores by difficulty: ', error);
        throw error;
    }
};

// Authentication Functions
export const signInWithGoogle = async () => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Google sign-in not available');
        return {
            user: {
                uid: 'demo-user',
                displayName: 'Demo Player',
                email: 'demo@example.com',
                photoURL: null
            }
        };
    }
    
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('User signed in:', result.user.displayName);
        return result;
    } catch (error) {
        // Log simplified error message instead of full error object
        console.warn('Sign-in error:', error.code || 'Unknown error');
        
        // Check for specific error codes
        if (error.code === 'auth/configuration-not-found') {
            const friendlyError = new Error('Google Sign-In is not configured. Please enable it in Firebase Console.');
            friendlyError.code = 'auth/not-configured';
            friendlyError.originalError = error;
            throw friendlyError;
        } else if (error.code === 'auth/popup-closed-by-user') {
            const friendlyError = new Error('Sign-in cancelled');
            friendlyError.code = 'auth/cancelled';
            throw friendlyError;
        } else if (error.code === 'auth/unauthorized-domain') {
            const currentDomain = window.location.hostname;
            const friendlyError = new Error(`Domain not authorized: ${currentDomain}`);
            friendlyError.code = 'auth/unauthorized-domain';
            friendlyError.domain = currentDomain;
            throw friendlyError;
        }
        
        throw error;
    }
};

export const signInWithGithub = async () => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: GitHub sign-in not available');
        return {
            user: {
                uid: 'demo-user-github',
                displayName: 'Demo GitHub User',
                email: 'demo@github.com',
                photoURL: null
            }
        };
    }
    
    try {
        const provider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('User signed in with GitHub:', result.user.displayName);
        return result;
    } catch (error) {
        console.warn('GitHub sign-in error:', error.code || 'Unknown error');
        
        if (error.code === 'auth/popup-closed-by-user') {
            const friendlyError = new Error('Sign-in cancelled');
            friendlyError.code = 'auth/cancelled';
            throw friendlyError;
        } else if (error.code === 'auth/unauthorized-domain') {
            const currentDomain = window.location.hostname;
            const friendlyError = new Error(`Domain not authorized: ${currentDomain}`);
            friendlyError.code = 'auth/unauthorized-domain';
            friendlyError.domain = currentDomain;
            throw friendlyError;
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            const friendlyError = new Error('An account already exists with the same email address but different sign-in credentials.');
            friendlyError.code = 'auth/account-exists';
            throw friendlyError;
        }
        
        throw error;
    }
};

export const signUpWithEmail = async (email, password, displayName) => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Email sign-up not available');
        return {
            user: {
                uid: 'demo-user-email',
                displayName: displayName || 'Demo User',
                email: email,
                photoURL: null
            }
        };
    }
    
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile with display name
        if (displayName) {
            await updateProfile(result.user, {
                displayName: displayName
            });
        }
        
        console.log('User created:', result.user.email);
        return result;
    } catch (error) {
        console.warn('Sign-up error:', error.code || 'Unknown error');
        
        if (error.code === 'auth/email-already-in-use') {
            const friendlyError = new Error('This email is already registered. Please sign in instead.');
            friendlyError.code = 'auth/email-exists';
            throw friendlyError;
        } else if (error.code === 'auth/weak-password') {
            const friendlyError = new Error('Password should be at least 6 characters.');
            friendlyError.code = 'auth/weak-password';
            throw friendlyError;
        } else if (error.code === 'auth/invalid-email') {
            const friendlyError = new Error('Invalid email address.');
            friendlyError.code = 'auth/invalid-email';
            throw friendlyError;
        }
        
        throw error;
    }
};

export const signInWithEmail = async (email, password) => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Email sign-in not available');
        return {
            user: {
                uid: 'demo-user-email',
                displayName: 'Demo User',
                email: email,
                photoURL: null
            }
        };
    }
    
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', result.user.email);
        return result;
    } catch (error) {
        console.warn('Sign-in error:', error.code || 'Unknown error');
        
        if (error.code === 'auth/user-not-found') {
            const friendlyError = new Error('No account found with this email.');
            friendlyError.code = 'auth/user-not-found';
            throw friendlyError;
        } else if (error.code === 'auth/wrong-password') {
            const friendlyError = new Error('Incorrect password.');
            friendlyError.code = 'auth/wrong-password';
            throw friendlyError;
        } else if (error.code === 'auth/invalid-email') {
            const friendlyError = new Error('Invalid email address.');
            friendlyError.code = 'auth/invalid-email';
            throw friendlyError;
        }
        
        throw error;
    }
};

export const resetPassword = async (email) => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Password reset not available');
        return true;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email sent to:', email);
        return true;
    } catch (error) {
        console.warn('Password reset error:', error.code || 'Unknown error');
        
        if (error.code === 'auth/user-not-found') {
            const friendlyError = new Error('No account found with this email.');
            friendlyError.code = 'auth/user-not-found';
            throw friendlyError;
        } else if (error.code === 'auth/invalid-email') {
            const friendlyError = new Error('Invalid email address.');
            friendlyError.code = 'auth/invalid-email';
            throw friendlyError;
        }
        
        throw error;
    }
};

export const signOutUser = async () => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Sign out');
        return;
    }
    
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

export const onAuthStateChange = (callback) => {
    if (!auth || !isFirebaseEnabled) {
        console.log('Demo mode: Auth state change listener not active');
        // Call callback with null user in demo mode
        callback(null);
        return () => {};
    }
    
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
    if (!auth || !isFirebaseEnabled) {
        return null;
    }
    return auth.currentUser;
};

export const isAuthAvailable = () => {
    return auth !== null && isFirebaseEnabled;
};

// Initialize Firebase app
export { app, analytics, db, auth, isFirebaseEnabled };