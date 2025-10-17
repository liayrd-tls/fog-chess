import { getPieceSymbol } from '../../chessLogic';

function BoardSquare({
  piece,
  isVisible,
  isSelected,
  isPossibleMove,
  isLastMove,
  isDark,
  onClick
}) {
  return (
    <div
      className={`square ${isDark ? 'dark' : 'light'}
        ${isSelected ? 'selected' : ''}
        ${isPossibleMove ? 'possible-move' : ''}
        ${isLastMove ? 'last-move' : ''}
        ${!isVisible ? 'fog' : ''}`}
      onClick={onClick}
    >
      {isVisible && piece && (
        <span className={`piece ${piece.color}`}>
          {getPieceSymbol(piece)}
        </span>
      )}
    </div>
  );
}

export default BoardSquare;
