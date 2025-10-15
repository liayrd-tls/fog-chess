import { useState, useEffect } from 'react';
import './App.css';
import Lobby from './Lobby';
import { useMultiplayer } from './useMultiplayer';
import {
  initializeBoard,
  normalizeBoard,
  getPossibleMoves,
  getVisibleSquares,
  makeMove as makeChessMove,
  getPieceSymbol,
  COLORS
} from './chessLogic';

function App() {
  // Game type: null (lobby), 'local', or 'multiplayer'
  const [gameType, setGameType] = useState(null);

  // Local game state
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(COLORS.WHITE);
  const [gameMode, setGameMode] = useState('casual');
  const [possibleMoves, setPossibleMoves] = useState([]);

  // Multiplayer hook
  const multiplayer = useMultiplayer();

  // Get current game state based on game type
  const activeBoard = gameType === 'multiplayer' && multiplayer.gameState
    ? normalizeBoard(multiplayer.gameState.board)
    : board;

  const activeCurrentPlayer = gameType === 'multiplayer' && multiplayer.gameState
    ? multiplayer.gameState.currentPlayer
    : currentPlayer;

  const activeGameMode = gameType === 'multiplayer' && multiplayer.gameState
    ? multiplayer.gameState.gameMode
    : gameMode;

  // Start local game
  const handlePlayLocal = () => {
    setGameType('local');
    setBoard(initializeBoard());
    setCurrentPlayer(COLORS.WHITE);
    setGameMode('casual');
  };

  // Create multiplayer room
  const handleCreateRoom = async (mode) => {
    const roomId = await multiplayer.createRoom(mode);
    if (roomId) {
      setGameType('multiplayer');
    }
  };

  // Join multiplayer room
  const handleJoinRoom = async (roomId) => {
    const success = await multiplayer.joinRoom(roomId);
    if (success) {
      setGameType('multiplayer');
    }
  };

  // Leave game and return to lobby
  const handleLeaveGame = () => {
    setGameType(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    if (gameType === 'multiplayer') {
      multiplayer.leaveRoom();
    }
  };

  // Handle square click
  const handleSquareClick = (row, col) => {
    const piece = activeBoard[row][col];

    // In multiplayer, only allow moves if it's your turn
    if (gameType === 'multiplayer') {
      if (activeCurrentPlayer !== multiplayer.playerColor) {
        return; // Not your turn
      }
    }

    // If a square is already selected
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;

      // Check if clicked square is a valid move
      const isValidMove = possibleMoves.some(
        ([moveRow, moveCol]) => moveRow === row && moveCol === col
      );

      if (isValidMove) {
        // Make the move
        const newBoard = makeChessMove(activeBoard, selectedRow, selectedCol, row, col);

        if (gameType === 'multiplayer') {
          multiplayer.makeMove(newBoard, selectedRow, selectedCol, row, col);
        } else {
          setBoard(newBoard);
          setCurrentPlayer(activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
        }

        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (piece && piece.color === activeCurrentPlayer) {
        // Select a different piece of the same color
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // No square selected, try to select this square
      if (piece && piece.color === activeCurrentPlayer) {
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col));
      }
    }
  };

  // Reset game
  const handleResetGame = () => {
    if (gameType === 'multiplayer') {
      multiplayer.resetGame();
    } else {
      setBoard(initializeBoard());
      setCurrentPlayer(COLORS.WHITE);
    }
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  // Change game mode
  const handleChangeMode = (mode) => {
    if (gameType === 'multiplayer') {
      // Only room creator (white player) can change mode
      if (multiplayer.playerColor === COLORS.WHITE) {
        multiplayer.changeGameMode(mode);
      }
    } else {
      setGameMode(mode);
    }
  };

  // Clear selection when game state changes in multiplayer
  useEffect(() => {
    if (gameType === 'multiplayer' && multiplayer.gameState) {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [gameType, multiplayer.gameState]);

  // Show lobby if no game is active
  if (!gameType) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onPlayLocal={handlePlayLocal}
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

  const visibleSquares = getVisibleSquares(activeBoard, activeCurrentPlayer, activeGameMode);

  const isSquareVisible = (row, col) => {
    return visibleSquares.has(`${row},${col}`);
  };

  const isSquareSelected = (row, col) => {
    return selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
  };

  const isSquarePossibleMove = (row, col) => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isMyTurn = gameType !== 'multiplayer' || activeCurrentPlayer === multiplayer.playerColor;

  // Rotate board for black player in multiplayer
  const shouldRotateBoard = gameType === 'multiplayer' && multiplayer.playerColor === COLORS.BLACK;
  const displayBoard = shouldRotateBoard
    ? [...activeBoard].reverse().map(row => [...row].reverse())
    : activeBoard;

  // Adjust coordinates for rotated board
  const getActualCoordinates = (row, col) => {
    if (shouldRotateBoard) {
      return [7 - row, 7 - col];
    }
    return [row, col];
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Fog Chess</h1>

        {gameType === 'multiplayer' && (
          <div className="multiplayer-info">
            <div className="room-info">
              <span className="label">Room:</span>
              <span className="room-code">{multiplayer.roomId}</span>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(multiplayer.roomId)}
              >
                Copy
              </button>
            </div>
            <div className="player-info">
              <span className="label">You are:</span>
              <span className={`player-color ${multiplayer.playerColor}`}>
                {multiplayer.playerColor === COLORS.WHITE ? '○' : '●'} {multiplayer.playerColor}
              </span>
              {!multiplayer.opponentConnected && (
                <span className="waiting">Waiting for opponent...</span>
              )}
            </div>
          </div>
        )}

        <div className="controls">
          <div className="mode-selector">
            <button
              className={activeGameMode === 'casual' ? 'active' : ''}
              onClick={() => handleChangeMode('casual')}
              disabled={gameType === 'multiplayer' && multiplayer.playerColor !== COLORS.WHITE}
            >
              Casual
            </button>
            <button
              className={activeGameMode === 'fog' ? 'active' : ''}
              onClick={() => handleChangeMode('fog')}
              disabled={gameType === 'multiplayer' && multiplayer.playerColor !== COLORS.WHITE}
            >
              Fog (1sq)
            </button>
            <button
              className={activeGameMode === 'movement' ? 'active' : ''}
              onClick={() => handleChangeMode('movement')}
              disabled={gameType === 'multiplayer' && multiplayer.playerColor !== COLORS.WHITE}
            >
              Movement
            </button>
          </div>

          <div className="game-info">
            <span className="current-player">
              {activeCurrentPlayer === COLORS.WHITE ? '○' : '●'} {activeCurrentPlayer}
              {gameType === 'multiplayer' && (
                <span className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
                  {isMyTurn ? ' (Your turn)' : ' (Opponent)'}
                </span>
              )}
            </span>
            <button onClick={handleResetGame} className="reset-btn">
              Reset
            </button>
            <button onClick={handleLeaveGame} className="leave-btn">
              Leave
            </button>
          </div>
        </div>

        <div className="board">
          {displayBoard.map((row, displayRow) => (
            <div key={displayRow} className="board-row">
              {row && row.map((piece, displayCol) => {
                const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
                const isVisible = isSquareVisible(actualRow, actualCol);
                const isSelected = isSquareSelected(actualRow, actualCol);
                const isPossibleMove = isSquarePossibleMove(actualRow, actualCol);
                const isDark = (actualRow + actualCol) % 2 === 1;

                return (
                  <div
                    key={`${displayRow}-${displayCol}`}
                    className={`square ${isDark ? 'dark' : 'light'}
                      ${isSelected ? 'selected' : ''}
                      ${isPossibleMove ? 'possible-move' : ''}
                      ${!isVisible ? 'fog' : ''}`}
                    onClick={() => handleSquareClick(actualRow, actualCol)}
                  >
                    {isVisible && piece && (
                      <span className={`piece ${piece.color}`}>
                        {getPieceSymbol(piece)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mode-description">
          {activeGameMode === 'casual' && <p>Standard chess - all pieces visible</p>}
          {activeGameMode === 'fog' && <p>Enemy pieces hidden - only 1 square radius visible</p>}
          {activeGameMode === 'movement' && <p>Visibility based on where your pieces can move</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
