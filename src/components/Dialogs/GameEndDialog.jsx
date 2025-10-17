import { COLORS } from '../../chessLogic';
import { GAME_END_RESULTS } from '../../utils/constants';

function GameEndDialog({ result, winner, onMenu, onRematch }) {
  const getTitle = () => {
    switch (result) {
      case GAME_END_RESULTS.CHECKMATE:
        return 'Checkmate!';
      case GAME_END_RESULTS.STALEMATE:
        return 'Stalemate!';
      case GAME_END_RESULTS.TIMEOUT:
        return 'Time Expired!';
      default:
        return 'Game Over';
    }
  };

  const getResultContent = () => {
    if (result === GAME_END_RESULTS.STALEMATE) {
      return <p>Draw - no legal moves available</p>;
    }

    return (
      <>
        <div className={`winner-icon winner-${winner}`}></div>
        <p>
          {winner} wins{result === GAME_END_RESULTS.TIMEOUT ? ' by timeout' : ''}!
        </p>
      </>
    );
  };

  return (
    <div className="promotion-overlay game-end-overlay">
      <div className="promotion-dialog game-end-dialog">
        <h2 className="game-end-title">{getTitle()}</h2>
        <div className="game-end-result">{getResultContent()}</div>
        <div className="game-end-actions">
          <button className="game-end-btn menu-btn" onClick={onMenu}>
            Menu
          </button>
          <button className="game-end-btn rematch-btn" onClick={onRematch}>
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameEndDialog;
