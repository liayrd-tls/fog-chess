import { useEffect } from 'react';
import { COLORS } from '../chessLogic';
import { GAME_TYPES } from '../utils/constants';

export const useTimer = ({
  gameType,
  gameEnd,
  activeCurrentPlayer,
  activeTimers,
  localColor,
  myTurnForTimer,
  opponentConnected,
  setTimers,
  setGameEnd,
  updateMultiplayerTimer
}) => {
  useEffect(() => {
    if (!gameType || gameEnd) return;

    const interval = setInterval(() => {
      if (gameType === GAME_TYPES.LOCAL) {
        // Local game - countdown current player's timer
        setTimers(prev => {
          const newTime = prev[activeCurrentPlayer] - 1;
          if (newTime <= 0) {
            // Time expired
            const winner = activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
            setGameEnd({ result: 'timeout', winner });
            return { ...prev, [activeCurrentPlayer]: 0 };
          }
          return { ...prev, [activeCurrentPlayer]: newTime };
        });
      } else if (gameType === GAME_TYPES.MULTIPLAYER && myTurnForTimer && opponentConnected) {
        // Multiplayer - only count down if it's my turn
        const myTime = activeTimers[localColor];
        if (myTime > 0) {
          updateMultiplayerTimer(localColor, myTime - 1);
        } else if (myTime === 0 && !gameEnd) {
          // Time expired for local player
          const winner = localColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
          setGameEnd({ result: 'timeout', winner });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameType,
    activeCurrentPlayer,
    myTurnForTimer,
    opponentConnected,
    localColor,
    activeTimers,
    gameEnd,
    setTimers,
    setGameEnd,
    updateMultiplayerTimer
  ]);
};
