import { useEffect } from 'react';
import { getGameStatus } from '../chessLogic';

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
    }
  }, [gameType, activeBoard, activeCurrentPlayer, activeCastlingRights, gameEnd, setGameEnd]);
};
