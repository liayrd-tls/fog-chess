import { useState } from 'react';
import {
  initializeBoard,
  initializeCastlingRights,
  COLORS
} from '../chessLogic';
import { INITIAL_TIMER_SECONDS } from '../utils/constants';

export const useGameState = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(COLORS.WHITE);
  const [gameMode, setGameMode] = useState('movement');
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [promotionData, setPromotionData] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [timers, setTimers] = useState({
    white: INITIAL_TIMER_SECONDS,
    black: INITIAL_TIMER_SECONDS
  });
  const [castlingRights, setCastlingRights] = useState(initializeCastlingRights());
  const [gameEnd, setGameEnd] = useState(null);

  const resetLocalGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer(COLORS.WHITE);
    setTimers({ white: INITIAL_TIMER_SECONDS, black: INITIAL_TIMER_SECONDS });
    setCastlingRights(initializeCastlingRights());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setGameEnd(null);
  };

  const clearGameState = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPromotionData(null);
    setTimers({ white: INITIAL_TIMER_SECONDS, black: INITIAL_TIMER_SECONDS });
    setCastlingRights(initializeCastlingRights());
    setGameEnd(null);
  };

  return {
    // State
    board,
    selectedSquare,
    currentPlayer,
    gameMode,
    possibleMoves,
    promotionData,
    lastMove,
    timers,
    castlingRights,
    gameEnd,
    // Setters
    setBoard,
    setSelectedSquare,
    setCurrentPlayer,
    setGameMode,
    setPossibleMoves,
    setPromotionData,
    setLastMove,
    setTimers,
    setCastlingRights,
    setGameEnd,
    // Utils
    resetLocalGame,
    clearGameState
  };
};
