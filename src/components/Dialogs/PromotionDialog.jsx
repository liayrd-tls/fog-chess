import { PIECES } from '../../chessLogic';
import { getPieceImageUrl } from '../../utils/pieceImages';

function PromotionDialog({ currentPlayerColor, onSelectPiece }) {
  const promotionPieces = [
    { type: PIECES.QUEEN, name: 'Queen' },
    { type: PIECES.ROOK, name: 'Rook' },
    { type: PIECES.BISHOP, name: 'Bishop' },
    { type: PIECES.KNIGHT, name: 'Knight' }
  ];

  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h2>Promote Pawn</h2>
        <div className="promotion-options">
          {promotionPieces.map(({ type, name }) => (
            <button
              key={type}
              className="promotion-btn"
              onClick={() => onSelectPiece(type)}
            >
              <img
                src={getPieceImageUrl({ type, color: currentPlayerColor })}
                alt={`${currentPlayerColor} ${name}`}
                className="promotion-piece-image"
                draggable="false"
              />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionDialog;
