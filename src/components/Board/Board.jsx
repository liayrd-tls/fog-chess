import BoardSquare from './BoardSquare';
import BoardMarkers from './BoardMarkers';

function Board({
  board,
  visibleSquares,
  selectedSquare,
  possibleMoves,
  lastMove,
  shouldRotateBoard,
  gameMode,
  onSquareClick
}) {
  // Rotate board for black player
  const displayBoard = shouldRotateBoard
    ? [...board].reverse().map(row => [...row].reverse())
    : board;

  // Adjust coordinates for rotated board
  const getActualCoordinates = (row, col) => {
    if (shouldRotateBoard) {
      return [7 - row, 7 - col];
    }
    return [row, col];
  };

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
    if (!lastMove) return false;

    // In fog modes, only show last move highlight if the square is visible
    if (gameMode !== 'casual' && !isSquareVisible(row, col)) {
      return false;
    }

    const { from, to } = lastMove;
    return (from[0] === row && from[1] === col) || (to[0] === row && to[1] === col);
  };

  const { TopMarkers, LeftMarkers } = BoardMarkers({ shouldRotateBoard });

  return (
    <div className="board-wrapper">
      <div className="board-container">
        <TopMarkers />

        <div className="board-with-side-markers">
          <LeftMarkers />

          <div className="board">
            {displayBoard.map((row, displayRow) => (
              <div key={displayRow} className="board-row">
                {row && row.map((piece, displayCol) => {
                  const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
                  const isDark = (actualRow + actualCol) % 2 === 1;

                  return (
                    <BoardSquare
                      key={`${displayRow}-${displayCol}`}
                      piece={piece}
                      isVisible={isSquareVisible(actualRow, actualCol)}
                      isSelected={isSquareSelected(actualRow, actualCol)}
                      isPossibleMove={isSquarePossibleMove(actualRow, actualCol)}
                      isLastMove={isLastMoveSquare(actualRow, actualCol)}
                      isDark={isDark}
                      onClick={() => onSquareClick(actualRow, actualCol)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board;
