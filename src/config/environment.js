// Environment Configuration
// This file handles different environments and provides fallbacks

// Import Firebase configuration
import { firebaseConfig as importedConfig } from './firebase.config.js';

// Export the configuration
export const firebaseConfig = importedConfig;
export const isFirebaseEnabled = true;

console.log('Firebase configuration loaded successfully');