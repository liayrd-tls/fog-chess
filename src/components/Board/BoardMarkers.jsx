function BoardMarkers({ shouldRotateBoard }) {
  const columnLetters = shouldRotateBoard
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const rowNumbers = shouldRotateBoard
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : [8, 7, 6, 5, 4, 3, 2, 1];

  return {
    TopMarkers: () => (
      <div className="board-markers-top">
        <div className="corner-spacer"></div>
        {columnLetters.map((letter) => (
          <div key={letter} className="column-marker">{letter}</div>
        ))}
      </div>
    ),
    LeftMarkers: () => (
      <div className="board-markers-left">
        {rowNumbers.map((num) => (
          <div key={num} className="row-marker">{num}</div>
        ))}
      </div>
    )
  };
}

export default BoardMarkers;
