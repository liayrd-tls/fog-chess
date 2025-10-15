import { useState } from 'react';
import './App.css';
import {
  initializeBoard,
  getPossibleMoves,
  getVisibleSquares,
  makeMove,
  getPieceSymbol,
  COLORS
} from './chessLogic';

function App() {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(COLORS.WHITE);
  const [gameMode, setGameMode] = useState('casual');
  const [possibleMoves, setPossibleMoves] = useState([]);

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    // If a square is already selected
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const selectedPiece = board[selectedRow][selectedCol];

      // Check if clicked square is a valid move
      const isValidMove = possibleMoves.some(
        ([moveRow, moveCol]) => moveRow === row && moveCol === col
      );

      if (isValidMove) {
        // Make the move
        const newBoard = makeMove(board, selectedRow, selectedCol, row, col);
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (piece && piece.color === currentPlayer) {
        // Select a different piece of the same color
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(board, row, col));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // No square selected, try to select this square
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(board, row, col));
      }
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer(COLORS.WHITE);
    setPossibleMoves([]);
  };

  const visibleSquares = getVisibleSquares(board, currentPlayer, gameMode);

  const isSquareVisible = (row, col) => {
    return visibleSquares.has(`${row},${col}`);
  };

  const isSquareSelected = (row, col) => {
    return selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
  };

  const isSquarePossibleMove = (row, col) => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Fog Chess</h1>

        <div className="controls">
          <div className="mode-selector">
            <button
              className={gameMode === 'casual' ? 'active' : ''}
              onClick={() => setGameMode('casual')}
            >
              Casual
            </button>
            <button
              className={gameMode === 'fog' ? 'active' : ''}
              onClick={() => setGameMode('fog')}
            >
              Fog (1sq)
            </button>
            <button
              className={gameMode === 'movement' ? 'active' : ''}
              onClick={() => setGameMode('movement')}
            >
              Movement
            </button>
          </div>

          <div className="game-info">
            <span className="current-player">
              {currentPlayer === COLORS.WHITE ? '○' : '●'} {currentPlayer}
            </span>
            <button onClick={resetGame} className="reset-btn">
              Reset
            </button>
          </div>
        </div>

        <div className="board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((piece, colIndex) => {
                const isVisible = isSquareVisible(rowIndex, colIndex);
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isPossibleMove = isSquarePossibleMove(rowIndex, colIndex);
                const isDark = (rowIndex + colIndex) % 2 === 1;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`square ${isDark ? 'dark' : 'light'}
                      ${isSelected ? 'selected' : ''}
                      ${isPossibleMove ? 'possible-move' : ''}
                      ${!isVisible ? 'fog' : ''}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
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
          {gameMode === 'casual' && <p>Standard chess - all pieces visible</p>}
          {gameMode === 'fog' && <p>Enemy pieces hidden - only 1 square radius visible</p>}
          {gameMode === 'movement' && <p>Visibility based on where your pieces can move</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
