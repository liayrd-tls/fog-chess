// Game constants
export const GAME_TYPES = {
  LOCAL: 'local',
  MULTIPLAYER: 'multiplayer'
};

export const GAME_END_RESULTS = {
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  TIMEOUT: 'timeout'
};

export const INITIAL_TIMER_SECONDS = 600; // 10 minutes

export const SQUARE_SIZE = {
  DESKTOP: 80,
  TABLET: 70,
  MOBILE: '11vw',
  MOBILE_MAX: 45
};

// Export piece image utilities
export * from './pieceImages';

// Export sound effect utilities
export * from './soundEffects';
