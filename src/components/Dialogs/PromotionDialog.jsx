import { PIECES } from '../../chessLogic';

function PromotionDialog({ currentPlayerColor, onSelectPiece }) {
  const promotionPieces = [
    { type: PIECES.QUEEN, symbol: '♛', name: 'Queen' },
    { type: PIECES.ROOK, symbol: '♜', name: 'Rook' },
    { type: PIECES.BISHOP, symbol: '♝', name: 'Bishop' },
    { type: PIECES.KNIGHT, symbol: '♞', name: 'Knight' }
  ];

  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h2>Promote Pawn</h2>
        <div className="promotion-options">
          {promotionPieces.map(({ type, symbol, name }) => (
            <button
              key={type}
              className="promotion-btn"
              onClick={() => onSelectPiece(type)}
            >
              <span className={`piece ${currentPlayerColor}`}>{symbol}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionDialog;
