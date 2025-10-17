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
  getCapturedPieces,
  getMaterialAdvantage,
  initializeCastlingRights,
  updateCastlingRights,
  getGameStatus,
  COLORS,
  PIECES
} from './chessLogic';

function App() {
  // Game type: null (lobby), 'local', or 'multiplayer'
  const [gameType, setGameType] = useState(null);

  // Local game state
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(COLORS.WHITE);
  const [gameMode, setGameMode] = useState('movement');
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [promotionData, setPromotionData] = useState(null); // {board, fromRow, fromCol, toRow, toCol}
  const [lastMove, setLastMove] = useState(null); // {from: [row, col], to: [row, col]}
  const [timers, setTimers] = useState({ white: 600, black: 600 }); // 10 minutes = 600 seconds
  const [castlingRights, setCastlingRights] = useState(initializeCastlingRights());
  const [gameEnd, setGameEnd] = useState(null); // {result: 'checkmate'|'stalemate'|'timeout', winner: color|null}

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

  const activeLastMove = gameType === 'multiplayer' && multiplayer.gameState && multiplayer.gameState.lastMove
    ? multiplayer.gameState.lastMove
    : lastMove;

  const activeTimers = gameType === 'multiplayer' && multiplayer.gameState && multiplayer.gameState.timers
    ? multiplayer.gameState.timers
    : timers;

  const activeCastlingRights = gameType === 'multiplayer' && multiplayer.gameState && multiplayer.gameState.castlingRights
    ? multiplayer.gameState.castlingRights
    : castlingRights;

  // Determine local player early for timer logic
  const localColor = gameType === 'multiplayer' ? multiplayer.playerColor : COLORS.WHITE;
  const myTurnForTimer = gameType !== 'multiplayer' || activeCurrentPlayer === multiplayer.playerColor;

  // Timer countdown
  useEffect(() => {
    if (!gameType || gameEnd) return; // Don't count in lobby or if game ended

    const interval = setInterval(() => {
      if (gameType === 'local') {
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
      } else if (gameType === 'multiplayer' && myTurnForTimer && multiplayer.opponentConnected) {
        // Multiplayer - only count down if it's my turn
        const myTime = activeTimers[localColor];
        if (myTime > 0) {
          multiplayer.updateTimer(localColor, myTime - 1);
        } else if (myTime === 0 && !gameEnd) {
          // Time expired for local player
          const winner = localColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
          setGameEnd({ result: 'timeout', winner });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameType, activeCurrentPlayer, myTurnForTimer, multiplayer.opponentConnected, localColor, activeTimers, multiplayer, gameEnd]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check for game end (checkmate/stalemate) after each move
  useEffect(() => {
    if (!gameType || !activeBoard || gameEnd) return;

    const status = getGameStatus(activeBoard, activeCurrentPlayer, activeCastlingRights);
    if (status.gameOver) {
      setGameEnd({ result: status.result, winner: status.winner });
    }
  }, [gameType, activeBoard, activeCurrentPlayer, activeCastlingRights, gameEnd]);

  // Start local game
  const handlePlayLocal = () => {
    setGameType('local');
    setBoard(initializeBoard());
    setCurrentPlayer(COLORS.WHITE);
    setGameMode('movement');
    setCastlingRights(initializeCastlingRights());
    setGameEnd(null);
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

  // Auto match
  const handleAutoMatch = async (mode) => {
    await multiplayer.autoMatch(mode);
  };

  // When auto match finds a game, set game type
  useEffect(() => {
    if (multiplayer.roomId && !gameType) {
      setGameType('multiplayer');
    }
  }, [multiplayer.roomId, gameType]);

  // Leave game and return to lobby
  const handleLeaveGame = async () => {
    if (gameType === 'multiplayer') {
      await multiplayer.leaveRoom();
    }
    setGameType(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPromotionData(null);
    setTimers({ white: 600, black: 600 });
    setCastlingRights(initializeCastlingRights());
    setGameEnd(null);
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
        const movingPiece = activeBoard[selectedRow][selectedCol];

        // Check for pawn promotion
        const isPromotion = movingPiece.type === 'P' &&
                           ((movingPiece.color === COLORS.WHITE && row === 0) ||
                            (movingPiece.color === COLORS.BLACK && row === 7));

        if (isPromotion) {
          // Show promotion dialog for both local and multiplayer
          setPromotionData({
            board: activeBoard,
            fromRow: selectedRow,
            fromCol: selectedCol,
            toRow: row,
            toCol: col
          });
          setSelectedSquare(null);
          setPossibleMoves([]);
        } else {
          // Make the move normally
          const newBoard = makeChessMove(activeBoard, selectedRow, selectedCol, row, col);
          const movingPiece = activeBoard[selectedRow][selectedCol];

          // Update castling rights
          const newCastlingRights = updateCastlingRights(activeCastlingRights, movingPiece, selectedRow, selectedCol);

          // Track the move
          setLastMove({ from: [selectedRow, selectedCol], to: [row, col] });

          if (gameType === 'multiplayer') {
            multiplayer.makeMove(newBoard, selectedRow, selectedCol, row, col, newCastlingRights);
          } else {
            setBoard(newBoard);
            setCurrentPlayer(activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
            setCastlingRights(newCastlingRights);
          }

          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else if (piece && piece.color === activeCurrentPlayer) {
        // Select a different piece of the same color
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col, activeCastlingRights));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // No square selected, try to select this square
      if (piece && piece.color === activeCurrentPlayer) {
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col, activeCastlingRights));
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
      setTimers({ white: 600, black: 600 });
      setCastlingRights(initializeCastlingRights());
    }
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setGameEnd(null);
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

  // Handle pawn promotion
  const handlePromotion = (pieceType) => {
    if (!promotionData) return;

    const { board, fromRow, fromCol, toRow, toCol } = promotionData;
    const newBoard = makeChessMove(board, fromRow, fromCol, toRow, toCol);

    // Replace pawn with selected piece
    const movingPiece = board[fromRow][fromCol];
    newBoard[toRow][toCol] = { type: pieceType, color: movingPiece.color };

    // Update castling rights
    const newCastlingRights = updateCastlingRights(activeCastlingRights, movingPiece, fromRow, fromCol);

    // Track the move
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });

    if (gameType === 'multiplayer') {
      multiplayer.makeMove(newBoard, fromRow, fromCol, toRow, toCol, newCastlingRights);
    } else {
      setBoard(newBoard);
      setCurrentPlayer(activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
      setCastlingRights(newCastlingRights);
    }

    setPromotionData(null);
  };

  // Clear selection when board changes in multiplayer (not just timer updates)
  useEffect(() => {
    if (gameType === 'multiplayer' && multiplayer.gameState) {
      // Only clear selection when it's not our turn anymore
      if (activeCurrentPlayer !== multiplayer.playerColor) {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  }, [gameType, multiplayer.gameState?.lastMove, multiplayer.playerColor, activeCurrentPlayer]);

  // Handle opponent disconnect - kick back to lobby
  useEffect(() => {
    if (gameType === 'multiplayer' && multiplayer.error && multiplayer.error.includes('Opponent left')) {
      // Give user time to see the error message, then return to lobby
      const timer = setTimeout(() => {
        setGameType(null);
        setSelectedSquare(null);
        setPossibleMoves([]);
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

  // In multiplayer, always see from your own perspective, not the current turn player
  const visibilityPlayerColor = gameType === 'multiplayer'
    ? multiplayer.playerColor
    : activeCurrentPlayer;

  const visibleSquares = getVisibleSquares(activeBoard, visibilityPlayerColor, activeGameMode);

  const isSquareVisible = (row, col) => {
    return visibleSquares.has(`${row},${col}`);
  };

  const isSquareSelected = (row, col) => {
    return selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
  };

  const isSquarePossibleMove = (row, col) => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isLastMoveSquare = (row, col) => {
    if (!activeLastMove) return false;

    // In fog modes, only show last move highlight if the square is visible
    if (activeGameMode !== 'casual' && !isSquareVisible(row, col)) {
      return false;
    }

    const { from, to } = activeLastMove;
    return (from[0] === row && from[1] === col) || (to[0] === row && to[1] === col);
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

  // Calculate captured pieces
  const capturedPieces = getCapturedPieces(activeBoard);
  const materialAdvantage = getMaterialAdvantage(capturedPieces);

  // Determine local player and opponent
  const localPlayerColor = gameType === 'multiplayer' ? multiplayer.playerColor : COLORS.WHITE;
  const opponentColor = localPlayerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

  // Local player's captured pieces (pieces they captured from opponent)
  const localCaptured = localPlayerColor === COLORS.WHITE ? capturedPieces.black : capturedPieces.white;
  const opponentCaptured = opponentColor === COLORS.WHITE ? capturedPieces.black : capturedPieces.white;

  // Material advantage from local player's perspective
  const localAdvantage = localPlayerColor === COLORS.WHITE ? materialAdvantage : -materialAdvantage;

  return (
    <div className="app">
      <div className="container">
        <h1>Fog Chess</h1>

        {gameType === 'multiplayer' && (
          <>
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
            {multiplayer.error && (
              <div className="game-error">
                {multiplayer.error}
              </div>
            )}
          </>
        )}

        <div className="controls">
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

        {/* Opponent's Captured Pieces - Above Board */}
        <div className="captured-bar opponent">
          <div className="timer">{formatTime(activeTimers[opponentColor])}</div>
          <div className="captured-pieces-inline">
            {opponentCaptured.length === 0 ? (
              <span className="no-captures-inline">—</span>
            ) : (
              opponentCaptured.map((piece, idx) => (
                <span key={idx} className="captured-piece-small" style={{color: opponentColor === COLORS.WHITE ? '#fff' : '#0a0a0a'}}>
                  {getPieceSymbol({ type: piece, color: opponentColor })}
                </span>
              ))
            )}
          </div>
          {localAdvantage < 0 && (
            <div className="advantage-badge">+{Math.abs(localAdvantage)}</div>
          )}
        </div>

        <div className="board-wrapper">
          <div className="board-container">
            {/* Top column markers (a-h) */}
            <div className="board-markers-top">
              <div className="corner-spacer"></div>
              {(shouldRotateBoard ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map((letter) => (
                <div key={letter} className="column-marker">{letter}</div>
              ))}
            </div>

            <div className="board-with-side-markers">
              {/* Left row markers (8-1) */}
              <div className="board-markers-left">
                {(shouldRotateBoard ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map((num) => (
                  <div key={num} className="row-marker">{num}</div>
                ))}
              </div>

              {/* Chess board */}
              <div className="board">
                {displayBoard.map((row, displayRow) => (
                  <div key={displayRow} className="board-row">
                    {row && row.map((piece, displayCol) => {
                      const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
                      const isVisible = isSquareVisible(actualRow, actualCol);
                      const isSelected = isSquareSelected(actualRow, actualCol);
                      const isPossibleMove = isSquarePossibleMove(actualRow, actualCol);
                      const isLastMove = isLastMoveSquare(actualRow, actualCol);
                      const isDark = (actualRow + actualCol) % 2 === 1;

                      return (
                        <div
                          key={`${displayRow}-${displayCol}`}
                          className={`square ${isDark ? 'dark' : 'light'}
                            ${isSelected ? 'selected' : ''}
                            ${isPossibleMove ? 'possible-move' : ''}
                            ${isLastMove ? 'last-move' : ''}
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
            </div>
          </div>
        </div>

        {/* Local Player's Captured Pieces - Below Board */}
        <div className="captured-bar local">
          <div className="timer">{formatTime(activeTimers[localPlayerColor])}</div>
          <div className="captured-pieces-inline">
            {localCaptured.length === 0 ? (
              <span className="no-captures-inline">—</span>
            ) : (
              localCaptured.map((piece, idx) => (
                <span key={idx} className="captured-piece-small" style={{color: localPlayerColor === COLORS.WHITE ? '#fff' : '#0a0a0a'}}>
                  {getPieceSymbol({ type: piece, color: localPlayerColor })}
                </span>
              ))
            )}
          </div>
          {localAdvantage > 0 && (
            <div className="advantage-badge">+{localAdvantage}</div>
          )}
        </div>

        <div className="mode-description">
          {activeGameMode === 'casual' && <p>Standard chess - all pieces visible</p>}
          {activeGameMode === 'fog' && <p>Enemy pieces hidden - only 1 square radius visible</p>}
          {activeGameMode === 'movement' && <p>Visibility based on where your pieces can move</p>}
        </div>

        {/* Pawn Promotion Dialog */}
        {promotionData && (
          <div className="promotion-overlay">
            <div className="promotion-dialog">
              <h2>Promote Pawn</h2>
              <div className="promotion-options">
                <button className="promotion-btn" onClick={() => handlePromotion(PIECES.QUEEN)}>
                  <span className={`piece ${activeCurrentPlayer}`}>♛</span>
                  <span>Queen</span>
                </button>
                <button className="promotion-btn" onClick={() => handlePromotion(PIECES.ROOK)}>
                  <span className={`piece ${activeCurrentPlayer}`}>♜</span>
                  <span>Rook</span>
                </button>
                <button className="promotion-btn" onClick={() => handlePromotion(PIECES.BISHOP)}>
                  <span className={`piece ${activeCurrentPlayer}`}>♝</span>
                  <span>Bishop</span>
                </button>
                <button className="promotion-btn" onClick={() => handlePromotion(PIECES.KNIGHT)}>
                  <span className={`piece ${activeCurrentPlayer}`}>♞</span>
                  <span>Knight</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game End Dialog */}
        {gameEnd && (
          <div className="promotion-overlay game-end-overlay">
            <div className="promotion-dialog game-end-dialog">
              <h2 className="game-end-title">
                {gameEnd.result === 'checkmate' && 'Checkmate!'}
                {gameEnd.result === 'stalemate' && 'Stalemate!'}
                {gameEnd.result === 'timeout' && 'Time Expired!'}
              </h2>
              <div className="game-end-result">
                {gameEnd.result === 'checkmate' && (
                  <>
                    <div className="winner-icon">{gameEnd.winner === COLORS.WHITE ? '○' : '●'}</div>
                    <p>{gameEnd.winner} wins!</p>
                  </>
                )}
                {gameEnd.result === 'stalemate' && (
                  <p>Draw - no legal moves available</p>
                )}
                {gameEnd.result === 'timeout' && (
                  <>
                    <div className="winner-icon">{gameEnd.winner === COLORS.WHITE ? '○' : '●'}</div>
                    <p>{gameEnd.winner} wins by timeout!</p>
                  </>
                )}
              </div>
              <div className="game-end-actions">
                <button className="game-end-btn menu-btn" onClick={handleLeaveGame}>
                  Menu
                </button>
                <button className="game-end-btn rematch-btn" onClick={handleResetGame}>
                  Rematch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
