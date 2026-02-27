// Audio Manager for Pong Arena
// Uses Web Audio API to generate retro-style game sounds

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.masterVolume = 0.3;
        this.musicVolume = 0.2;
        this.sfxVolume = 0.4;
        
        // Check localStorage for saved preferences
        const savedSettings = localStorage.getItem('audioSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.musicEnabled = settings.musicEnabled !== false;
            this.sfxEnabled = settings.sfxEnabled !== false;
        }
        
        // Background music oscillator
        this.musicOscillator = null;
        this.musicGain = null;
        
        // Initialize on first user interaction (required by browsers)
        this.initialized = false;
    }
    
    // Initialize audio context (call on first user interaction)
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled
        }));
    }
    
    // Toggle all audio
    toggleAudio() {
        const newState = !(this.musicEnabled && this.sfxEnabled);
        this.musicEnabled = newState;
        this.sfxEnabled = newState;
        
        if (!newState) {
            this.stopMusic();
        }
        
        this.saveSettings();
        return newState;
    }
    
    // Toggle just music
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        this.saveSettings();
        return this.musicEnabled;
    }
    
    // Toggle sound effects
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        return this.sfxEnabled;
    }
    
    // Play paddle hit sound
    playPaddleHit() {
        if (!this.sfxEnabled || !this.initialized) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    
    // Play wall hit sound
    playWallHit() {
        if (!this.sfxEnabled || !this.initialized) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.6 * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }
    
    // Play score sound
    playScore(isPlayer1) {
        if (!this.sfxEnabled || !this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Play a triumphant ascending tone
        [400, 500, 600, 800].forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.5 * this.masterVolume, now + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
            
            oscillator.start(now + i * 0.1);
            oscillator.stop(now + i * 0.1 + 0.15);
        });
    }
    
    // Play game start sound
    playGameStart() {
        if (!this.sfxEnabled || !this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Rising power-up sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
    
    // Play game over sound
    playGameOver() {
        if (!this.sfxEnabled || !this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Descending dramatic sound
        [500, 400, 300, 200].forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.6 * this.masterVolume, now + i * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
            
            oscillator.start(now + i * 0.15);
            oscillator.stop(now + i * 0.15 + 0.2);
        });
    }
    
    // Start background music
    startMusic() {
        if (!this.musicEnabled || !this.initialized || this.musicOscillator) return;
        
        const now = this.audioContext.currentTime;
        
        // Create a simple melodic loop using multiple oscillators
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(this.musicVolume * this.masterVolume, now);
        
        // Bass line
        this.playMusicNote(150, 0, 0.5);
        this.playMusicNote(150, 1, 0.5);
        this.playMusicNote(200, 2, 0.5);
        this.playMusicNote(150, 3, 0.5);
        
        // Set flag to indicate music is playing
        this.musicOscillator = true;
        
        // Loop the music every 4 seconds
        this.musicInterval = setInterval(() => {
            if (this.musicEnabled && this.initialized) {
                this.playMusicNote(150, 0, 0.5);
                this.playMusicNote(150, 1, 0.5);
                this.playMusicNote(200, 2, 0.5);
                this.playMusicNote(150, 3, 0.5);
            }
        }, 4000);
    }
    
    // Play a single music note
    playMusicNote(frequency, delay, duration) {
        if (!this.musicEnabled || !this.initialized || !this.musicGain) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        
        oscillator.connect(this.musicGain);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration);
    }
    
    // Stop background music
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        
        if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
        }
        
        this.musicOscillator = null;
    }
    
    // Check if audio is enabled
    isEnabled() {
        return this.musicEnabled || this.sfxEnabled;
    }
}
