import { getPieceImageUrl } from '../../utils/pieceImages';

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
        <img
          src={getPieceImageUrl(piece)}
          alt={`${piece.color} ${piece.type}`}
          className="piece-image"
          draggable="false"
        />
      )}
    </div>
  );
}

export default BoardSquare;
