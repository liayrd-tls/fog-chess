import { getPieceImageUrl } from '../../utils/pieceImages';

function CapturedPiecesBar({
  capturedPieces,
  playerColor,
  timer,
  advantage,
  position = 'local'
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`captured-bar ${position}`}>
      <div className="timer">{formatTime(timer)}</div>
      <div className="captured-pieces-inline">
        {capturedPieces.length === 0 ? (
          <span className="no-captures-inline">—</span>
        ) : (
          capturedPieces.map((piece, idx) => (
            <img
              key={idx}
              src={getPieceImageUrl({ type: piece, color: playerColor })}
              alt={`${playerColor} ${piece}`}
              className="captured-piece-image"
              draggable="false"
            />
          ))
        )}
      </div>
      {advantage > 0 && (
        <div className="advantage-badge">+{advantage}</div>
      )}
    </div>
  );
}

export default CapturedPiecesBar;
