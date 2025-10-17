import { COLORS } from '../../chessLogic';

function GameControls({
  currentPlayer,
  isMultiplayer,
  isMyTurn,
  onReset,
  onLeave
}) {
  return (
    <div className="controls">
      <div className="game-info">
        <span className="current-player">
          {currentPlayer === COLORS.WHITE ? '○' : '●'} {currentPlayer}
          {isMultiplayer && (
            <span className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
              {isMyTurn ? ' (Your turn)' : ' (Opponent)'}
            </span>
          )}
        </span>
        <button onClick={onReset} className="reset-btn">
          Reset
        </button>
        <button onClick={onLeave} className="leave-btn">
          Leave
        </button>
      </div>
    </div>
  );
}

export default GameControls;
