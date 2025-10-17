function GameModeDescription({ gameMode }) {
  const descriptions = {
    casual: 'Standard chess - all pieces visible',
    fog: 'Enemy pieces hidden - only 1 square radius visible',
    movement: 'Visibility based on where your pieces can move'
  };

  return (
    <div className="mode-description">
      <p>{descriptions[gameMode]}</p>
    </div>
  );
}

export default GameModeDescription;
