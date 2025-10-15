// Chess piece types
export const PIECES = {
  PAWN: 'P',
  ROOK: 'R',
  KNIGHT: 'N',
  BISHOP: 'B',
  QUEEN: 'Q',
  KING: 'K'
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Normalize board from Firebase (fixes array serialization issues)
export const normalizeBoard = (board) => {
  if (!board) return initializeBoard();

  const normalized = [];
  for (let i = 0; i < 8; i++) {
    normalized[i] = [];
    for (let j = 0; j < 8; j++) {
      // Check if the cell exists in the board data
      if (board[i] && board[i][j] !== undefined && board[i][j] !== null) {
        normalized[i][j] = board[i][j];
      } else {
        normalized[i][j] = null;
      }
    }
  }
  return normalized;
};

// Initialize chess board
export const initializeBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces
  board[0] = [
    { type: PIECES.ROOK, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.QUEEN, color: COLORS.BLACK },
    { type: PIECES.KING, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.ROOK, color: COLORS.BLACK }
  ];
  board[1] = Array(8).fill(null).map(() => ({ type: PIECES.PAWN, color: COLORS.BLACK }));

  // White pieces
  board[6] = Array(8).fill(null).map(() => ({ type: PIECES.PAWN, color: COLORS.WHITE }));
  board[7] = [
    { type: PIECES.ROOK, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.QUEEN, color: COLORS.WHITE },
    { type: PIECES.KING, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.ROOK, color: COLORS.WHITE }
  ];

  return board;
};

// Check if position is within board bounds
const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

// Find king position for a given color
const findKing = (board, color) => {
  for (let row = 0; row < 8; row++) {
    if (!board[row]) continue;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECES.KING && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
};

// Check if a square is under attack by opponent
const isSquareUnderAttack = (board, row, col, byColor) => {
  // Check all opponent pieces to see if any can attack this square
  for (let r = 0; r < 8; r++) {
    if (!board[r]) continue;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, r, c);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Get raw moves without check validation (used internally)
const getRawMoves = (board, row, col) => {
  if (!board || !board[row]) return [];
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const { type, color } = piece;
  const direction = color === COLORS.WHITE ? -1 : 1;

  switch (type) {
    case PIECES.PAWN:
      // Forward move
      if (isValidPosition(row + direction, col) && board[row + direction] && !board[row + direction][col]) {
        moves.push([row + direction, col]);
        // Double move from starting position
        const startRow = color === COLORS.WHITE ? 6 : 1;
        if (row === startRow && board[row + 2 * direction] && !board[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
        }
      }
      // Captures
      [-1, 1].forEach(colOffset => {
        const newRow = row + direction;
        const newCol = col + colOffset;
        if (isValidPosition(newRow, newCol) && board[newRow] && board[newRow][newCol] &&
            board[newRow][newCol].color !== color) {
          moves.push([newRow, newCol]);
        }
      });
      break;

    case PIECES.ROOK:
      // Horizontal and vertical
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dRow, dCol]) => {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dRow * i;
          const newCol = col + dCol * i;
          if (!isValidPosition(newRow, newCol) || !board[newRow]) break;
          if (board[newRow][newCol]) {
            if (board[newRow][newCol].color !== color) {
              moves.push([newRow, newCol]);
            }
            break;
          }
          moves.push([newRow, newCol]);
        }
      });
      break;

    case PIECES.KNIGHT:
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (isValidPosition(newRow, newCol) && board[newRow] &&
            (!board[newRow][newCol] || board[newRow][newCol].color !== color)) {
          moves.push([newRow, newCol]);
        }
      });
      break;

    case PIECES.BISHOP:
      // Diagonals
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dRow * i;
          const newCol = col + dCol * i;
          if (!isValidPosition(newRow, newCol) || !board[newRow]) break;
          if (board[newRow][newCol]) {
            if (board[newRow][newCol].color !== color) {
              moves.push([newRow, newCol]);
            }
            break;
          }
          moves.push([newRow, newCol]);
        }
      });
      break;

    case PIECES.QUEEN:
      // Combination of rook and bishop
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dRow * i;
          const newCol = col + dCol * i;
          if (!isValidPosition(newRow, newCol) || !board[newRow]) break;
          if (board[newRow][newCol]) {
            if (board[newRow][newCol].color !== color) {
              moves.push([newRow, newCol]);
            }
            break;
          }
          moves.push([newRow, newCol]);
        }
      });
      break;

    case PIECES.KING:
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (isValidPosition(newRow, newCol) && board[newRow] &&
            (!board[newRow][newCol] || board[newRow][newCol].color !== color)) {
          moves.push([newRow, newCol]);
        }
      });
      break;
  }

  return moves;
};

// Check if king is in check
export const isInCheck = (board, color) => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  return isSquareUnderAttack(board, kingPos[0], kingPos[1], opponentColor);
};

// Test if a move is legal (doesn't leave king in check)
const isMoveLegal = (board, fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  // Prevent capturing king
  const targetPiece = board[toRow][toCol];
  if (targetPiece && targetPiece.type === PIECES.KING) {
    return false;
  }

  // Simulate the move
  const testBoard = board.map(row => row ? [...row] : Array(8).fill(null));
  testBoard[toRow][toCol] = testBoard[fromRow][fromCol];
  testBoard[fromRow][fromCol] = null;

  // Check if our king is in check after this move
  return !isInCheck(testBoard, piece.color);
};

// Get possible moves for a piece (with check validation)
export const getPossibleMoves = (board, row, col) => {
  const rawMoves = getRawMoves(board, row, col);

  // Filter out moves that would leave king in check
  return rawMoves.filter(([toRow, toCol]) => isMoveLegal(board, row, col, toRow, toCol));
};

// Get visible squares based on game mode
export const getVisibleSquares = (board, playerColor, mode) => {
  const visible = new Set();

  if (!board) return visible;

  if (mode === 'casual') {
    // All squares visible
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        visible.add(`${row},${col}`);
      }
    }
    return visible;
  }

  // Find all player pieces
  for (let row = 0; row < 8; row++) {
    if (!board[row]) continue;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        // Always see own pieces
        visible.add(`${row},${col}`);

        if (mode === 'fog') {
          // 1 square radius around each piece
          for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
              const newRow = row + dRow;
              const newCol = col + dCol;
              if (isValidPosition(newRow, newCol)) {
                visible.add(`${newRow},${newCol}`);
              }
            }
          }
        } else if (mode === 'movement') {
          // All squares where this piece can move
          const moves = getPossibleMoves(board, row, col);
          moves.forEach(([moveRow, moveCol]) => {
            visible.add(`${moveRow},${moveCol}`);
          });
        }
      }
    }
  }

  return visible;
};

// Sanitize board for Firebase (remove undefined values and ensure proper array structure)
export const sanitizeBoardForFirebase = (board) => {
  const sanitized = [];
  for (let i = 0; i < 8; i++) {
    sanitized[i] = [];
    for (let j = 0; j < 8; j++) {
      if (board[i] && board[i][j] !== undefined && board[i][j] !== null) {
        // Keep the piece object
        sanitized[i][j] = board[i][j];
      } else {
        // Explicitly set null
        sanitized[i][j] = null;
      }
    }
  }
  // Force proper array structure by converting to JSON and back
  return JSON.parse(JSON.stringify(sanitized));
};

// Make a move
export const makeMove = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map(row => row ? [...row] : Array(8).fill(null));
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  return sanitizeBoardForFirebase(newBoard);
};

// Get piece symbol for display
export const getPieceSymbol = (piece) => {
  if (!piece) return '';

  // Use filled symbols for both colors (differentiate by CSS color)
  const symbols = {
    [PIECES.KING]: '♚',
    [PIECES.QUEEN]: '♛',
    [PIECES.ROOK]: '♜',
    [PIECES.BISHOP]: '♝',
    [PIECES.KNIGHT]: '♞',
    [PIECES.PAWN]: '♟'
  };

  return symbols[piece.type];
};
