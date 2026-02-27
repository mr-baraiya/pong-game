// Environment Configuration
// This file handles different environments and provides fallbacks

// Check if Firebase config exists, otherwise use demo mode
let firebaseConfig;
let isFirebaseEnabled = true;

try {
    // Try to import the real Firebase config
    const configModule = await import('./firebase.config.js');
    firebaseConfig = configModule.firebaseConfig;
} catch (error) {
    console.warn('Firebase configuration not found. Running in demo mode.');
    console.warn('To enable Firebase features, copy firebase.config.template.js to firebase.config.js and add your credentials.');
    
    // Demo configuration (non-functional)
    firebaseConfig = {
        apiKey: "demo-api-key",
        authDomain: "demo-project.firebaseapp.com",
        projectId: "demo-project",
        storageBucket: "demo-project.firebasestorage.app",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:demo",
        measurementId: "G-DEMO"
    };
    
    isFirebaseEnabled = false;
}

export { firebaseConfig, isFirebaseEnabled };