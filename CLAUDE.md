# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fog Chess is a React-based multiplayer chess game with three fog-of-war game modes:
- **Casual**: Standard chess with all pieces visible
- **Fog (1-square radius)**: Enemy pieces hidden, only 1-square radius around your pieces is visible
- **Movement**: Visibility based on where your pieces can move

The game supports both local single-player and real-time multiplayer via Firebase Realtime Database, with a Progressive Web App (PWA) implementation for mobile support.

## Build & Run Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

## Architecture & Key Concepts

### State Management Pattern
The app uses a dual-state approach:
- **Local state** (`useState` in App.jsx): For single-player games
- **Synced Firebase state** (`useMultiplayer` hook): For multiplayer games
- Active values (e.g., `activeBoard`, `activeCurrentPlayer`) resolve which source to use based on `gameType`

### Firebase Data Synchronization

**Critical**: Firebase Realtime Database has specific serialization requirements:
- Arrays with `null` values may be converted to objects
- `undefined` values are rejected (only `null` is allowed)
- Empty arrays may be dropped entirely

**Solutions implemented**:
- `normalizeBoard()`: Reconstructs 8x8 board from Firebase data
- `sanitizeBoardForFirebase()`: Removes `undefined`, ensures proper structure before writes
- All Firebase writes must use sanitization

### Fog of War Implementation

Three visibility modes in `getVisibleSquares()`:
- Uses `Set<"row,col">` for O(1) lookup performance
- In multiplayer, visibility is **always calculated from player's own perspective**, not the current turn player
- Each player sees different fog based on their pieces, even when watching opponent's turn

### Chess Rules Enforcement

The chess engine (`chessLogic.js`) implements proper chess rules:
- `getRawMoves()`: Generates piece movement without validation (internal use)
- `getPossibleMoves()`: Filters moves through `isMoveLegal()` to prevent:
  - King captures (explicitly blocked)
  - Moves that leave king in check
  - Moves when in check that don't defend the king
- `isInCheck()`: Detects check state
- `isSquareUnderAttack()`: Validates square safety

### Multiplayer Architecture

**Room Management**:
- Rooms stored at `/rooms/{roomId}` in Firebase
- Room creator is white, joiner is black
- Board perspective auto-rotates for black player

**Matchmaking Queue**:
- Queue stored at `/queue/{gameMode}/{playerId}`
- First player joins queue and waits
- Second player matches, creates room, both players auto-join
- Listeners detect when removed from queue (matched)
- Cleanup on unmount prevents stale entries

**Disconnect Handling**:
- Players removed from room on leave
- Opponent notified when player disconnects
- Room deleted when empty
- Both players kicked to lobby after 2-second error display

### Last Move Tracking

Both local and multiplayer games track `lastMove: {from: [row, col], to: [row, col]}`:
- Stored in Firebase game state for multiplayer
- Local state for single-player
- Used to highlight both origin and destination squares

### Board Display & Rotation

For black player in multiplayer:
- Board visually rotated 180° (`shouldRotateBoard`)
- Coordinate mapping via `getActualCoordinates()` ensures clicks work correctly
- Prevents confusion of upside-down perspective

## File Structure

```
src/
├── App.jsx              - Main game component, routing, board display
├── chessLogic.js        - Chess rules engine, move validation, visibility
├── useMultiplayer.js    - Firebase multiplayer hook (rooms, matchmaking, sync)
├── Lobby.jsx            - Room creation/joining, auto-match UI
├── firebase.js          - Firebase config
├── main.jsx            - React entry point
└── App.css             - Styles (board, pieces, responsive design)

public/
├── manifest.json       - PWA manifest
├── sw.js              - Service worker for offline support
└── icon-*.png         - App icons (generated)
```

## Common Patterns

### Making Moves
1. User clicks piece → `setSelectedSquare()` → `setPossibleMoves(getPossibleMoves(...))`
2. User clicks destination → validate move in `possibleMoves`
3. Check for pawn promotion (reaching opposite end)
4. If promotion: show dialog, wait for piece selection
5. Else: `makeChessMove()` → update board/Firebase → switch turn

### Adding Game Features
- **Modify chess logic**: Update `chessLogic.js` functions
- **UI changes**: Update `App.jsx` render and `App.css`
- **Multiplayer sync**: Ensure new state is saved/loaded in `useMultiplayer.js`
- **Test both modes**: Always test in both local and multiplayer

### Firebase Schema
```javascript
rooms/{roomId}:
  board: Array[8][8]           // Piece objects or null
  currentPlayer: "white"|"black"
  gameMode: "casual"|"fog"|"movement"
  players: { white: playerId, black: playerId }
  createdAt: timestamp
  lastMove: { from: [r,c], to: [r,c], timestamp }

queue/{gameMode}/{playerId}:
  playerId: string
  timestamp: number
  gameMode: string
```

## Important Implementation Notes

- **Never use undefined with Firebase**: Always use `null` for empty squares
- **Always normalize Firebase data**: Use `normalizeBoard()` when reading from Firebase
- **Sanitize before writing**: Use `sanitizeBoardForFirebase()` before any Firebase write
- **Fog visibility perspective**: In multiplayer, use `multiplayer.playerColor`, not `currentPlayer`
- **Board rotation**: Black player sees rotated board; coordinate mapping is essential
- **Piece icons**: Using filled Unicode symbols (♚♛♜♝♞♟), differentiated by CSS color
- **Check validation**: All move generation goes through `isMoveLegal()` filter
