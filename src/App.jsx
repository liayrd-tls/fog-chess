import { useState, useEffect } from 'react';
import './App.css';
import Lobby from './Lobby';
import Board from './components/Board/Board';
import GameControls from './components/Game/GameControls';
import GameModeDescription from './components/Game/GameModeDescription';
import CapturedPiecesBar from './components/Game/CapturedPiecesBar';
import MultiplayerInfo from './components/Multiplayer/MultiplayerInfo';
import PromotionDialog from './components/Dialogs/PromotionDialog';
import GameEndDialog from './components/Dialogs/GameEndDialog';
import { useMultiplayer } from './useMultiplayer';
import { useGameState } from './hooks/useGameState';
import { useTimer } from './hooks/useTimer';
import { useGameEnd } from './hooks/useGameEnd';
import { useMoveHandler } from './hooks/useMoveHandler';
import {
  normalizeBoard,
  getVisibleSquares,
  getCapturedPieces,
  getMaterialAdvantage,
  COLORS
} from './chessLogic';
import { GAME_TYPES, preloadPieceImages, preloadAllSounds, playSound, SOUND_TYPES } from './utils/constants';

function App() {
  // Game type: null (lobby), 'local', or 'multiplayer'
  const [gameType, setGameType] = useState(null);

  // Preload piece images and sounds on mount
  useEffect(() => {
    preloadPieceImages().catch(err => {
      console.warn('Failed to preload some piece images:', err);
    });

    preloadAllSounds().catch(err => {
      console.warn('Failed to preload some sound effects:', err);
    });
  }, []);

  // Local game state
  const gameState = useGameState();

  // Multiplayer hook
  const multiplayer = useMultiplayer();

  // Get active game state (either local or multiplayer)
  const activeBoard = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState
    ? normalizeBoard(multiplayer.gameState.board)
    : gameState.board;

  const activeCurrentPlayer = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState
    ? multiplayer.gameState.currentPlayer
    : gameState.currentPlayer;

  const activeGameMode = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState
    ? multiplayer.gameState.gameMode
    : gameState.gameMode;

  const activeLastMove = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState?.lastMove
    ? multiplayer.gameState.lastMove
    : gameState.lastMove;

  const activeTimers = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState?.timers
    ? multiplayer.gameState.timers
    : gameState.timers;

  const activeCastlingRights = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState?.castlingRights
    ? multiplayer.gameState.castlingRights
    : gameState.castlingRights;

  // Timer logic
  const localColor = gameType === GAME_TYPES.MULTIPLAYER ? multiplayer.playerColor : COLORS.WHITE;
  const myTurnForTimer = gameType !== GAME_TYPES.MULTIPLAYER || activeCurrentPlayer === multiplayer.playerColor;

  useTimer({
    gameType,
    gameEnd: gameState.gameEnd,
    activeCurrentPlayer,
    activeTimers,
    localColor,
    myTurnForTimer,
    opponentConnected: multiplayer.opponentConnected,
    setTimers: gameState.setTimers,
    setGameEnd: gameState.setGameEnd,
    updateMultiplayerTimer: multiplayer.updateTimer
  });

  // Game end detection
  useGameEnd({
    gameType,
    activeBoard,
    activeCurrentPlayer,
    activeCastlingRights,
    gameEnd: gameState.gameEnd,
    setGameEnd: gameState.setGameEnd
  });

  // Move handler
  const { handleSquareClick, handlePromotion } = useMoveHandler({
    gameType,
    activeBoard,
    activeCurrentPlayer,
    activeCastlingRights,
    selectedSquare: gameState.selectedSquare,
    possibleMoves: gameState.possibleMoves,
    playerColor: multiplayer.playerColor,
    setSelectedSquare: gameState.setSelectedSquare,
    setPossibleMoves: gameState.setPossibleMoves,
    setPromotionData: gameState.setPromotionData,
    setLastMove: gameState.setLastMove,
    setBoard: gameState.setBoard,
    setCurrentPlayer: gameState.setCurrentPlayer,
    setCastlingRights: gameState.setCastlingRights,
    makeMultiplayerMove: multiplayer.makeMove
  });

  // Game lifecycle handlers
  const handlePlayLocal = () => {
    setGameType(GAME_TYPES.LOCAL);
    gameState.resetLocalGame();
    playSound(SOUND_TYPES.GAME_START);
  };

  const handleCreateRoom = async (mode) => {
    const roomId = await multiplayer.createRoom(mode);
    if (roomId) {
      setGameType(GAME_TYPES.MULTIPLAYER);
      playSound(SOUND_TYPES.GAME_START);
    }
  };

  const handleJoinRoom = async (roomId) => {
    const success = await multiplayer.joinRoom(roomId);
    if (success) {
      setGameType(GAME_TYPES.MULTIPLAYER);
      playSound(SOUND_TYPES.GAME_START);
    }
  };

  const handleAutoMatch = async (mode) => {
    await multiplayer.autoMatch(mode);
  };

  const handleLeaveGame = async () => {
    if (gameType === GAME_TYPES.MULTIPLAYER) {
      await multiplayer.leaveRoom();
    }
    setGameType(null);
    gameState.clearGameState();
  };

  const handleResetGame = () => {
    if (gameType === GAME_TYPES.MULTIPLAYER) {
      multiplayer.resetGame();
    } else {
      gameState.resetLocalGame();
    }
  };

  // Auto match - set game type when room is found
  useEffect(() => {
    if (multiplayer.roomId && !gameType) {
      setGameType(GAME_TYPES.MULTIPLAYER);
    }
  }, [multiplayer.roomId, gameType]);

  // Clear selection when turn changes in multiplayer
  useEffect(() => {
    if (gameType === GAME_TYPES.MULTIPLAYER && multiplayer.gameState) {
      if (activeCurrentPlayer !== multiplayer.playerColor) {
        gameState.setSelectedSquare(null);
        gameState.setPossibleMoves([]);
      }
    }
  }, [gameType, multiplayer.gameState?.lastMove, multiplayer.playerColor, activeCurrentPlayer]);

  // Handle opponent disconnect
  useEffect(() => {
    if (gameType === GAME_TYPES.MULTIPLAYER && multiplayer.error?.includes('Opponent left')) {
      const timer = setTimeout(() => {
        setGameType(null);
        gameState.setSelectedSquare(null);
        gameState.setPossibleMoves([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameType, multiplayer.error]);

  // Show lobby if no game is active
  if (!gameType) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onPlayLocal={handlePlayLocal}
        onAutoMatch={handleAutoMatch}
        onCancelSearch={multiplayer.cancelSearch}
        searching={multiplayer.searching}
        error={multiplayer.error}
      />
    );
  }

  // Wait for board to load in multiplayer
  if (!activeBoard || !Array.isArray(activeBoard) || activeBoard.length !== 8) {
    return (
      <div className="app">
        <div className="container">
          <h1>Fog Chess</h1>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Calculate visibility and captured pieces
  const visibilityPlayerColor = gameType === GAME_TYPES.MULTIPLAYER
    ? multiplayer.playerColor
    : activeCurrentPlayer;

  const visibleSquares = getVisibleSquares(activeBoard, visibilityPlayerColor, activeGameMode);
  const capturedPieces = getCapturedPieces(activeBoard);
  const materialAdvantage = getMaterialAdvantage(capturedPieces);

  // Determine local player and opponent
  const localPlayerColor = gameType === GAME_TYPES.MULTIPLAYER ? multiplayer.playerColor : COLORS.WHITE;
  const opponentColor = localPlayerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

  const localCaptured = localPlayerColor === COLORS.WHITE ? capturedPieces.black : capturedPieces.white;
  const opponentCaptured = opponentColor === COLORS.WHITE ? capturedPieces.black : capturedPieces.white;

  const localAdvantage = localPlayerColor === COLORS.WHITE ? materialAdvantage : -materialAdvantage;

  const isMyTurn = gameType !== GAME_TYPES.MULTIPLAYER || activeCurrentPlayer === multiplayer.playerColor;
  const shouldRotateBoard = gameType === GAME_TYPES.MULTIPLAYER && multiplayer.playerColor === COLORS.BLACK;

  return (
    <div className="app">
      <div className="container">
        <h1>Fog Chess</h1>

        {gameType === GAME_TYPES.MULTIPLAYER && (
          <MultiplayerInfo
            roomId={multiplayer.roomId}
            playerColor={multiplayer.playerColor}
            opponentConnected={multiplayer.opponentConnected}
            error={multiplayer.error}
          />
        )}

        <GameControls
          currentPlayer={activeCurrentPlayer}
          isMultiplayer={gameType === GAME_TYPES.MULTIPLAYER}
          isMyTurn={isMyTurn}
          onReset={handleResetGame}
          onLeave={handleLeaveGame}
        />

        <CapturedPiecesBar
          capturedPieces={opponentCaptured}
          playerColor={opponentColor}
          timer={activeTimers[opponentColor]}
          advantage={localAdvantage < 0 ? Math.abs(localAdvantage) : 0}
          position="opponent"
        />

        <Board
          board={activeBoard}
          visibleSquares={visibleSquares}
          selectedSquare={gameState.selectedSquare}
          possibleMoves={gameState.possibleMoves}
          lastMove={activeLastMove}
          shouldRotateBoard={shouldRotateBoard}
          gameMode={activeGameMode}
          onSquareClick={handleSquareClick}
        />

        <CapturedPiecesBar
          capturedPieces={localCaptured}
          playerColor={localPlayerColor}
          timer={activeTimers[localPlayerColor]}
          advantage={localAdvantage > 0 ? localAdvantage : 0}
          position="local"
        />

        <GameModeDescription gameMode={activeGameMode} />

        {gameState.promotionData && (
          <PromotionDialog
            currentPlayerColor={activeCurrentPlayer}
            onSelectPiece={handlePromotion}
          />
        )}

        {gameState.gameEnd && (
          <GameEndDialog
            result={gameState.gameEnd.result}
            winner={gameState.gameEnd.winner}
            onMenu={handleLeaveGame}
            onRematch={handleResetGame}
          />
        )}
      </div>
    </div>
  );
}

export default App;
