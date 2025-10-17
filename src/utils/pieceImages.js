import { PIECES, COLORS } from '../chessLogic';

// Map piece types to chess.com notation
const PIECE_NOTATION = {
  [PIECES.KING]: 'k',
  [PIECES.QUEEN]: 'q',
  [PIECES.ROOK]: 'r',
  [PIECES.BISHOP]: 'b',
  [PIECES.KNIGHT]: 'n',
  [PIECES.PAWN]: 'p'
};

// Map color to chess.com notation
const COLOR_NOTATION = {
  [COLORS.WHITE]: 'w',
  [COLORS.BLACK]: 'b'
};

/**
 * Get the image URL for a chess piece
 * @param {Object} piece - Piece object with type and color
 * @returns {string} - URL to the piece image
 */
export const getPieceImageUrl = (piece) => {
  if (!piece) return null;

  const colorCode = COLOR_NOTATION[piece.color];
  const pieceCode = PIECE_NOTATION[piece.type];

  if (!colorCode || !pieceCode) {
    console.warn('Invalid piece:', piece);
    return null;
  }

  // Use local images from public/pieces folder
  return `/pieces/${colorCode}${pieceCode}.png`;
};

/**
 * Get all piece image URLs for preloading
 * @returns {string[]} - Array of all piece image URLs
 */
export const getAllPieceImageUrls = () => {
  const urls = [];

  Object.values(COLORS).forEach(color => {
    Object.values(PIECES).forEach(piece => {
      urls.push(getPieceImageUrl({ type: piece, color }));
    });
  });

  return urls;
};

/**
 * Preload piece images
 * @returns {Promise} - Resolves when all images are loaded
 */
export const preloadPieceImages = () => {
  const urls = getAllPieceImageUrls();

  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(url);
      img.src = url;
    });
  });

  return Promise.all(promises);
};
