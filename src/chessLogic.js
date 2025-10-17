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
const getRawMoves = (board, row, col, castlingRights = null) => {
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

      // Castling
      if (castlingRights && castlingRights[color]) {
        const baseRow = color === COLORS.WHITE ? 7 : 0;

        // King-side castling (O-O)
        if (castlingRights[color].kingSide && row === baseRow && col === 4) {
          // Check if squares between king and rook are empty
          if (!board[baseRow][5] && !board[baseRow][6]) {
            // Check if rook is in place
            const rook = board[baseRow][7];
            if (rook && rook.type === PIECES.ROOK && rook.color === color) {
              moves.push([baseRow, 6]); // King moves to g-file
            }
          }
        }

        // Queen-side castling (O-O-O)
        if (castlingRights[color].queenSide && row === baseRow && col === 4) {
          // Check if squares between king and rook are empty
          if (!board[baseRow][3] && !board[baseRow][2] && !board[baseRow][1]) {
            // Check if rook is in place
            const rook = board[baseRow][0];
            if (rook && rook.type === PIECES.ROOK && rook.color === color) {
              moves.push([baseRow, 2]); // King moves to c-file
            }
          }
        }
      }
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
const isMoveLegal = (board, fromRow, fromCol, toRow, toCol, castlingRights = null) => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  // Prevent capturing king
  const targetPiece = board[toRow][toCol];
  if (targetPiece && targetPiece.type === PIECES.KING) {
    return false;
  }

  // Special validation for castling
  if (piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    // This is a castling move
    const baseRow = piece.color === COLORS.WHITE ? 7 : 0;
    const direction = toCol > fromCol ? 1 : -1;

    // King must not be in check
    if (isInCheck(board, piece.color)) {
      return false;
    }

    // King must not pass through check
    const passThroughCol = fromCol + direction;
    const testBoard1 = board.map(row => row ? [...row] : Array(8).fill(null));
    testBoard1[baseRow][passThroughCol] = testBoard1[baseRow][fromCol];
    testBoard1[baseRow][fromCol] = null;
    if (isInCheck(testBoard1, piece.color)) {
      return false;
    }

    // King must not land in check (checked below with normal move simulation)
  }

  // Simulate the move
  const testBoard = board.map(row => row ? [...row] : Array(8).fill(null));
  testBoard[toRow][toCol] = testBoard[fromRow][fromCol];
  testBoard[fromRow][fromCol] = null;

  // For castling, also move the rook
  if (piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    const baseRow = piece.color === COLORS.WHITE ? 7 : 0;
    if (toCol === 6) {
      // King-side castling
      testBoard[baseRow][5] = testBoard[baseRow][7]; // Move rook from h to f
      testBoard[baseRow][7] = null;
    } else if (toCol === 2) {
      // Queen-side castling
      testBoard[baseRow][3] = testBoard[baseRow][0]; // Move rook from a to d
      testBoard[baseRow][0] = null;
    }
  }

  // Check if our king is in check after this move
  return !isInCheck(testBoard, piece.color);
};

// Get possible moves for a piece (with check validation)
export const getPossibleMoves = (board, row, col, castlingRights = null) => {
  const rawMoves = getRawMoves(board, row, col, castlingRights);

  // Filter out moves that would leave king in check
  return rawMoves.filter(([toRow, toCol]) => isMoveLegal(board, row, col, toRow, toCol, castlingRights));
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

// Initialize castling rights
export const initializeCastlingRights = () => ({
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true }
});

// Update castling rights after a move
export const updateCastlingRights = (castlingRights, piece, fromRow, fromCol) => {
  const newRights = JSON.parse(JSON.stringify(castlingRights));

  // If king moves, lose all castling rights for that color
  if (piece.type === PIECES.KING) {
    newRights[piece.color].kingSide = false;
    newRights[piece.color].queenSide = false;
  }

  // If rook moves from starting position, lose that side's castling
  if (piece.type === PIECES.ROOK) {
    if (piece.color === COLORS.WHITE && fromRow === 7) {
      if (fromCol === 0) newRights.white.queenSide = false;
      if (fromCol === 7) newRights.white.kingSide = false;
    } else if (piece.color === COLORS.BLACK && fromRow === 0) {
      if (fromCol === 0) newRights.black.queenSide = false;
      if (fromCol === 7) newRights.black.kingSide = false;
    }
  }

  return newRights;
};

// Make a move
export const makeMove = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map(row => row ? [...row] : Array(8).fill(null));
  const piece = newBoard[fromRow][fromCol];

  // Handle castling - move the rook
  if (piece && piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    const baseRow = piece.color === COLORS.WHITE ? 7 : 0;
    if (toCol === 6) {
      // King-side castling
      newBoard[baseRow][5] = newBoard[baseRow][7]; // Move rook from h to f
      newBoard[baseRow][7] = null;
    } else if (toCol === 2) {
      // Queen-side castling
      newBoard[baseRow][3] = newBoard[baseRow][0]; // Move rook from a to d
      newBoard[baseRow][0] = null;
    }
  }

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

// Piece values for material advantage
const PIECE_VALUES = {
  [PIECES.PAWN]: 1,
  [PIECES.KNIGHT]: 3,
  [PIECES.BISHOP]: 3,
  [PIECES.ROOK]: 5,
  [PIECES.QUEEN]: 9,
  [PIECES.KING]: 0
};

// Calculate captured pieces from initial board
export const getCapturedPieces = (currentBoard) => {
  const initial = initializeBoard();

  // Count pieces in initial board
  const initialCounts = { white: {}, black: {} };
  const currentCounts = { white: {}, black: {} };

  // Initialize counts
  Object.values(PIECES).forEach(pieceType => {
    initialCounts.white[pieceType] = 0;
    initialCounts.black[pieceType] = 0;
    currentCounts.white[pieceType] = 0;
    currentCounts.black[pieceType] = 0;
  });

  // Count initial pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = initial[row][col];
      if (piece) {
        initialCounts[piece.color][piece.type]++;
      }
    }
  }

  // Count current pieces
  for (let row = 0; row < 8; row++) {
    if (!currentBoard[row]) continue;
    for (let col = 0; col < 8; col++) {
      const piece = currentBoard[row][col];
      if (piece) {
        currentCounts[piece.color][piece.type]++;
      }
    }
  }

  // Calculate captured pieces
  const captured = { white: [], black: [] };

  Object.values(PIECES).forEach(pieceType => {
    // White pieces captured by black
    const whiteCaptured = initialCounts.white[pieceType] - currentCounts.white[pieceType];
    for (let i = 0; i < whiteCaptured; i++) {
      captured.white.push(pieceType);
    }

    // Black pieces captured by white
    const blackCaptured = initialCounts.black[pieceType] - currentCounts.black[pieceType];
    for (let i = 0; i < blackCaptured; i++) {
      captured.black.push(pieceType);
    }
  });

  return captured;
};

// Calculate material advantage
export const getMaterialAdvantage = (capturedPieces) => {
  let whiteValue = 0;
  let blackValue = 0;

  capturedPieces.white.forEach(piece => {
    blackValue += PIECE_VALUES[piece]; // Black captured white pieces
  });

  capturedPieces.black.forEach(piece => {
    whiteValue += PIECE_VALUES[piece]; // White captured black pieces
  });

  return whiteValue - blackValue; // Positive means white ahead, negative means black ahead
};

// Check if a player has any legal moves
export const hasAnyLegalMoves = (board, color, castlingRights = null) => {
  for (let row = 0; row < 8; row++) {
    if (!board[row]) continue;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, row, col, castlingRights);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
};

// Check for checkmate
export const isCheckmate = (board, color, castlingRights = null) => {
  return isInCheck(board, color) && !hasAnyLegalMoves(board, color, castlingRights);
};

// Check for stalemate
export const isStalemate = (board, color, castlingRights = null) => {
  return !isInCheck(board, color) && !hasAnyLegalMoves(board, color, castlingRights);
};

// Get game status
export const getGameStatus = (board, currentPlayer, castlingRights = null) => {
  if (isCheckmate(board, currentPlayer, castlingRights)) {
    return {
      gameOver: true,
      result: 'checkmate',
      winner: currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE
    };
  }

  if (isStalemate(board, currentPlayer, castlingRights)) {
    return {
      gameOver: true,
      result: 'stalemate',
      winner: null
    };
  }

  return {
    gameOver: false,
    result: null,
    winner: null
  };
};
