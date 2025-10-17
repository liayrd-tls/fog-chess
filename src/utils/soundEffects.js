// Sound effects for chess game
// This module provides audio feedback for various game actions

// Sound types
export const SOUND_TYPES = {
  MOVE: 'move',
  CAPTURE: 'capture',
  CASTLE: 'castle',
  CHECK: 'check',
  CHECKMATE: 'checkmate',
  GAME_START: 'game-start',
  GAME_END: 'game-end',
  PROMOTION: 'promotion',
  ILLEGAL: 'illegal',
  TIMER_LOW: 'timer-low',
  TIMER_TICK: 'timer-tick'
};

// Sound file paths (from public/sounds folder)
const SOUND_PATHS = {
  [SOUND_TYPES.MOVE]: '/sounds/move.mp3',
  [SOUND_TYPES.CAPTURE]: '/sounds/capture.mp3',
  [SOUND_TYPES.CASTLE]: '/sounds/castle.mp3',
  [SOUND_TYPES.CHECK]: '/sounds/check.mp3',
  [SOUND_TYPES.CHECKMATE]: '/sounds/checkmate.mp3',
  [SOUND_TYPES.GAME_START]: '/sounds/game-start.mp3',
  [SOUND_TYPES.GAME_END]: '/sounds/game-end.mp3',
  [SOUND_TYPES.PROMOTION]: '/sounds/promotion.mp3',
  [SOUND_TYPES.ILLEGAL]: '/sounds/illegal.mp3',
  [SOUND_TYPES.TIMER_LOW]: '/sounds/timer-low.mp3',
  [SOUND_TYPES.TIMER_TICK]: '/sounds/timer-tick.mp3'
};

// Audio cache to avoid loading sounds multiple times
const audioCache = new Map();

// Settings
let soundEnabled = true;
let soundVolume = 0.5; // 0.0 to 1.0

/**
 * Enable or disable sound effects
 * @param {boolean} enabled - Whether sound effects should be enabled
 */
export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('chess-sound-enabled', JSON.stringify(enabled));
  }
};

/**
 * Set volume for sound effects
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export const setSoundVolume = (volume) => {
  soundVolume = Math.max(0, Math.min(1, volume));
  if (typeof window !== 'undefined') {
    localStorage.setItem('chess-sound-volume', soundVolume.toString());
  }
};

/**
 * Get current sound enabled state
 * @returns {boolean} - Whether sound is enabled
 */
export const isSoundEnabled = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('chess-sound-enabled');
    if (stored !== null) {
      return JSON.parse(stored);
    }
  }
  return soundEnabled;
};

/**
 * Get current volume level
 * @returns {number} - Current volume (0.0 to 1.0)
 */
export const getSoundVolume = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('chess-sound-volume');
    if (stored !== null) {
      return parseFloat(stored);
    }
  }
  return soundVolume;
};

/**
 * Preload a sound file
 * @param {string} soundType - Type of sound to preload
 * @returns {Promise<HTMLAudioElement>} - Promise that resolves with the audio element
 */
const preloadSound = (soundType) => {
  return new Promise((resolve, reject) => {
    if (audioCache.has(soundType)) {
      resolve(audioCache.get(soundType));
      return;
    }

    const path = SOUND_PATHS[soundType];
    if (!path) {
      reject(new Error(`Unknown sound type: ${soundType}`));
      return;
    }

    const audio = new Audio(path);
    audio.preload = 'auto';

    audio.addEventListener('canplaythrough', () => {
      audioCache.set(soundType, audio);
      resolve(audio);
    }, { once: true });

    audio.addEventListener('error', (e) => {
      console.warn(`Failed to load sound: ${soundType}`, e);
      reject(e);
    }, { once: true });
  });
};

/**
 * Preload all sound effects
 * @returns {Promise<void>} - Promise that resolves when all sounds are loaded
 */
export const preloadAllSounds = async () => {
  const soundTypes = Object.values(SOUND_TYPES);

  const promises = soundTypes.map(soundType =>
    preloadSound(soundType).catch(err => {
      // Don't fail if one sound fails to load
      console.warn(`Failed to preload sound: ${soundType}`, err);
      return null;
    })
  );

  await Promise.allSettled(promises);
};

/**
 * Play a sound effect
 * @param {string} soundType - Type of sound to play
 * @param {object} options - Optional playback options
 * @param {number} options.volume - Override default volume (0.0 to 1.0)
 * @param {boolean} options.loop - Whether to loop the sound
 * @returns {Promise<void>} - Promise that resolves when sound starts playing
 */
export const playSound = async (soundType, options = {}) => {
  if (!isSoundEnabled()) {
    return;
  }

  try {
    let audio;

    // Try to get from cache first
    if (audioCache.has(soundType)) {
      audio = audioCache.get(soundType).cloneNode();
    } else {
      // Load on demand if not preloaded
      const path = SOUND_PATHS[soundType];
      if (!path) {
        console.warn(`Unknown sound type: ${soundType}`);
        return;
      }
      audio = new Audio(path);
    }

    // Set volume
    const volume = options.volume !== undefined ? options.volume : getSoundVolume();
    audio.volume = Math.max(0, Math.min(1, volume));

    // Set loop
    if (options.loop) {
      audio.loop = true;
    }

    // Play the sound
    await audio.play();

    // Clean up after playback (if not looping)
    if (!options.loop) {
      audio.addEventListener('ended', () => {
        audio.remove();
      }, { once: true });
    }

    return audio; // Return audio element in case we need to control it
  } catch (error) {
    console.warn(`Failed to play sound: ${soundType}`, error);
  }
};

/**
 * Stop a currently playing sound
 * @param {HTMLAudioElement} audio - Audio element to stop
 */
export const stopSound = (audio) => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

/**
 * Play move sound based on move type
 * @param {object} moveInfo - Information about the move
 * @param {boolean} moveInfo.isCapture - Whether the move captures a piece
 * @param {boolean} moveInfo.isCastle - Whether the move is castling
 * @param {boolean} moveInfo.isCheck - Whether the move puts opponent in check
 * @param {boolean} moveInfo.isCheckmate - Whether the move is checkmate
 * @param {boolean} moveInfo.isPromotion - Whether the move is pawn promotion
 */
export const playMoveSound = (moveInfo = {}) => {
  const {
    isCapture,
    isCastle,
    isCheck,
    isCheckmate,
    isPromotion
  } = moveInfo;

  // Priority: checkmate > check > castle > promotion > capture > move
  if (isCheckmate) {
    playSound(SOUND_TYPES.CHECKMATE);
  } else if (isCheck) {
    playSound(SOUND_TYPES.CHECK);
  } else if (isCastle) {
    playSound(SOUND_TYPES.CASTLE);
  } else if (isPromotion) {
    playSound(SOUND_TYPES.PROMOTION);
  } else if (isCapture) {
    playSound(SOUND_TYPES.CAPTURE);
  } else {
    playSound(SOUND_TYPES.MOVE);
  }
};

// Initialize sound settings from localStorage on module load
if (typeof window !== 'undefined') {
  const storedEnabled = localStorage.getItem('chess-sound-enabled');
  if (storedEnabled !== null) {
    soundEnabled = JSON.parse(storedEnabled);
  }

  const storedVolume = localStorage.getItem('chess-sound-volume');
  if (storedVolume !== null) {
    soundVolume = parseFloat(storedVolume);
  }
}

export default {
  SOUND_TYPES,
  playSound,
  playMoveSound,
  stopSound,
  preloadAllSounds,
  setSoundEnabled,
  setSoundVolume,
  isSoundEnabled,
  getSoundVolume
};
