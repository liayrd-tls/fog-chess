import { useEffect } from 'react';
import { getGameStatus } from '../chessLogic';
import { playSound, SOUND_TYPES } from '../utils/soundEffects';

export const useGameEnd = ({
  gameType,
  activeBoard,
  activeCurrentPlayer,
  activeCastlingRights,
  gameEnd,
  setGameEnd
}) => {
  useEffect(() => {
    if (!gameType || !activeBoard || gameEnd) return;

    const status = getGameStatus(activeBoard, activeCurrentPlayer, activeCastlingRights);
    if (status.gameOver) {
      setGameEnd({ result: status.result, winner: status.winner });
      playSound(SOUND_TYPES.GAME_END);
    }
  }, [gameType, activeBoard, activeCurrentPlayer, activeCastlingRights, gameEnd, setGameEnd]);
};
