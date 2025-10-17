import {
  getPossibleMoves,
  makeMove as makeChessMove,
  updateCastlingRights,
  isInCheck,
  isCheckmate,
  COLORS,
  PIECES
} from '../chessLogic';
import { playMoveSound } from '../utils/soundEffects';

export const useMoveHandler = ({
  gameType,
  activeBoard,
  activeCurrentPlayer,
  activeCastlingRights,
  selectedSquare,
  possibleMoves,
  playerColor,
  setSelectedSquare,
  setPossibleMoves,
  setPromotionData,
  setLastMove,
  setBoard,
  setCurrentPlayer,
  setCastlingRights,
  makeMultiplayerMove
}) => {
  const handleSquareClick = (row, col) => {
    const piece = activeBoard[row][col];

    // In multiplayer, only allow moves if it's your turn
    if (gameType === 'multiplayer') {
      if (activeCurrentPlayer !== playerColor) {
        return; // Not your turn
      }
    }

    // If a square is already selected
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;

      // Check if clicked square is a valid move
      const isValidMove = possibleMoves.some(
        ([moveRow, moveCol]) => moveRow === row && moveCol === col
      );

      if (isValidMove) {
        const movingPiece = activeBoard[selectedRow][selectedCol];

        // Check for pawn promotion
        const isPromotion = movingPiece.type === PIECES.PAWN &&
          ((movingPiece.color === COLORS.WHITE && row === 0) ||
            (movingPiece.color === COLORS.BLACK && row === 7));

        if (isPromotion) {
          // Show promotion dialog
          setPromotionData({
            board: activeBoard,
            fromRow: selectedRow,
            fromCol: selectedCol,
            toRow: row,
            toCol: col
          });
          setSelectedSquare(null);
          setPossibleMoves([]);
        } else {
          // Make the move normally
          const newBoard = makeChessMove(activeBoard, selectedRow, selectedCol, row, col);
          const newCastlingRights = updateCastlingRights(
            activeCastlingRights,
            movingPiece,
            selectedRow,
            selectedCol
          );

          // Detect move type for sound effects
          const isCapture = activeBoard[row][col] !== null;
          const isCastle = movingPiece.type === PIECES.KING && Math.abs(col - selectedCol) === 2;
          const nextPlayer = activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
          const isCheck = isInCheck(newBoard, nextPlayer);
          const isMateCheck = isCheckmate(newBoard, nextPlayer, newCastlingRights);

          // Play appropriate sound
          playMoveSound({
            isCapture,
            isCastle,
            isCheck,
            isCheckmate: isMateCheck,
            isPromotion: false
          });

          // Track the move
          setLastMove({ from: [selectedRow, selectedCol], to: [row, col] });

          if (gameType === 'multiplayer') {
            makeMultiplayerMove(newBoard, selectedRow, selectedCol, row, col, newCastlingRights);
          } else {
            setBoard(newBoard);
            setCurrentPlayer(nextPlayer);
            setCastlingRights(newCastlingRights);
          }

          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else if (piece && piece.color === activeCurrentPlayer) {
        // Select a different piece of the same color
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col, activeCastlingRights));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // No square selected, try to select this square
      if (piece && piece.color === activeCurrentPlayer) {
        setSelectedSquare([row, col]);
        setPossibleMoves(getPossibleMoves(activeBoard, row, col, activeCastlingRights));
      }
    }
  };

  const handlePromotion = (pieceType) => {
    if (!promotionData) return;

    const { board, fromRow, fromCol, toRow, toCol } = promotionData;
    const newBoard = makeChessMove(board, fromRow, fromCol, toRow, toCol);

    // Replace pawn with selected piece
    const movingPiece = board[fromRow][fromCol];
    newBoard[toRow][toCol] = { type: pieceType, color: movingPiece.color };

    // Update castling rights
    const newCastlingRights = updateCastlingRights(activeCastlingRights, movingPiece, fromRow, fromCol);

    // Detect move type for sound effects
    const isCapture = board[toRow][toCol] !== null;
    const nextPlayer = activeCurrentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    const isCheck = isInCheck(newBoard, nextPlayer);
    const isMateCheck = isCheckmate(newBoard, nextPlayer, newCastlingRights);

    // Play promotion sound
    playMoveSound({
      isCapture,
      isCastle: false,
      isCheck,
      isCheckmate: isMateCheck,
      isPromotion: true
    });

    // Track the move
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });

    if (gameType === 'multiplayer') {
      makeMultiplayerMove(newBoard, fromRow, fromCol, toRow, toCol, newCastlingRights);
    } else {
      setBoard(newBoard);
      setCurrentPlayer(nextPlayer);
      setCastlingRights(newCastlingRights);
    }

    setPromotionData(null);
  };

  return {
    handleSquareClick,
    handlePromotion
  };
};
