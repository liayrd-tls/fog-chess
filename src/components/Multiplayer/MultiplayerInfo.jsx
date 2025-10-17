import { COLORS } from '../../chessLogic';

function MultiplayerInfo({
  roomId,
  playerColor,
  opponentConnected,
  error
}) {
  return (
    <>
      <div className="multiplayer-info">
        <div className="room-info">
          <span className="label">Room:</span>
          <span className="room-code">{roomId}</span>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(roomId)}
          >
            Copy
          </button>
        </div>
        <div className="player-info">
          <span className="label">You are:</span>
          <span className={`player-color ${playerColor}`}>
            {playerColor === COLORS.WHITE ? '○' : '●'} {playerColor}
          </span>
          {!opponentConnected && (
            <span className="waiting">Waiting for opponent...</span>
          )}
        </div>
      </div>
      {error && (
        <div className="game-error">
          {error}
        </div>
      )}
    </>
  );
}

export default MultiplayerInfo;
