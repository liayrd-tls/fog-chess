# Fog Chess - Architecture Documentation

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Board/           # Chess board related components
│   │   ├── Board.jsx           # Main board container with game logic
│   │   ├── BoardSquare.jsx     # Individual square component
│   │   └── BoardMarkers.jsx    # Column/row markers (a-h, 1-8)
│   ├── Game/            # Game UI components
│   │   ├── CapturedPiecesBar.jsx    # Display captured pieces and timer
│   │   ├── GameControls.jsx         # Reset/Leave buttons
│   │   └── GameModeDescription.jsx  # Game mode description text
│   ├── Dialogs/         # Modal dialogs
│   │   ├── PromotionDialog.jsx  # Pawn promotion piece selection
│   │   └── GameEndDialog.jsx    # Game over screen with results
│   └── Multiplayer/     # Multiplayer-specific components
│       └── MultiplayerInfo.jsx  # Room ID and player info display
├── hooks/               # Custom React hooks
│   ├── useGameState.js      # Local game state management
│   ├── useTimer.js          # Timer countdown logic
│   ├── useGameEnd.js        # Game end detection (checkmate/stalemate)
│   └── useMoveHandler.js    # Move execution and validation
├── utils/               # Utility functions and constants
│   ├── constants.js         # Game constants and configuration
│   └── pieceImages.js       # Chess piece image utilities
├── chessLogic.js        # Core chess rules and logic
├── useMultiplayer.js    # Firebase multiplayer hook
├── App.jsx              # Main application component
├── App.css              # Application styles
├── Lobby.jsx            # Lobby/menu component
└── Lobby.css            # Lobby styles
```

## Architecture Overview

### Component Layer

**Board Components**
- `Board.jsx`: Main board container that handles coordinate transformations, visibility checks, and renders the chess board
- `BoardSquare.jsx`: Individual square with piece rendering and interaction
- `BoardMarkers.jsx`: Column and row labels that adjust for board rotation

**Game Components**
- `CapturedPiecesBar.jsx`: Displays captured pieces, timer, and material advantage
- `GameControls.jsx`: Game control buttons (reset, leave)
- `GameModeDescription.jsx`: Shows current game mode description

**Dialog Components**
- `PromotionDialog.jsx`: Modal for pawn promotion piece selection
- `GameEndDialog.jsx`: Game end screen showing winner and offering rematch/menu options

**Multiplayer Components**
- `MultiplayerInfo.jsx`: Displays room information and player status

### Hooks Layer

**useGameState**
- Manages all local game state (board, timers, selected pieces, etc.)
- Provides reset and clear functions
- Single source of truth for local game data

**useTimer**
- Handles countdown logic for both players
- Detects timeout conditions
- Syncs with Firebase in multiplayer mode

**useGameEnd**
- Monitors for checkmate and stalemate conditions
- Updates game end state when detected

**useMoveHandler**
- Processes square clicks and move validation
- Handles pawn promotion
- Executes moves in both local and multiplayer modes

### Logic Layer

**chessLogic.js**
- Pure chess rule implementations
- Move generation and validation
- Check/checkmate/stalemate detection
- Board utilities and piece values
- Castling logic

**useMultiplayer.js**
- Firebase Realtime Database integration
- Room creation and joining
- Auto-matching system
- Game state synchronization

## Data Flow

### Local Game
1. User clicks square → `useMoveHandler.handleSquareClick()`
2. Validate move → `chessLogic.getPossibleMoves()`
3. Execute move → `chessLogic.makeMove()`
4. Update state → `useGameState` setters
5. Check game end → `useGameEnd`

### Multiplayer Game
1. User clicks square → `useMoveHandler.handleSquareClick()`
2. Validate move → `chessLogic.getPossibleMoves()`
3. Execute move → `chessLogic.makeMove()`
4. Sync to Firebase → `useMultiplayer.makeMove()`
5. Firebase updates → Other player receives update
6. Update local state → React re-renders
7. Check game end → `useGameEnd`

## Key Design Patterns

### Separation of Concerns
- **Presentation**: React components handle UI only
- **Logic**: Custom hooks manage state and side effects
- **Business Rules**: Pure functions in chessLogic.js

### Composition
- Small, focused components that compose together
- Hooks that encapsulate specific concerns
- Reusable utilities

### Unidirectional Data Flow
- Props flow down from parent to children
- Events bubble up through callbacks
- Single source of truth for state

## Game Modes

### Casual
Standard chess with all pieces visible

### Fog (1 square radius)
Fog of war - only squares within 1 square radius of your pieces are visible

### Movement
Fog of war - only squares where your pieces can move are visible

## Firebase Structure

```
rooms/
  {roomId}/
    board: Array<Array<Piece>>
    currentPlayer: 'white' | 'black'
    gameMode: 'casual' | 'fog' | 'movement'
    players:
      white: playerId
      black: playerId
    timers:
      white: number (seconds)
      black: number (seconds)
    castlingRights:
      white: { kingSide: boolean, queenSide: boolean }
      black: { kingSide: boolean, queenSide: boolean }
    lastMove: { from: [row, col], to: [row, col], timestamp: number }
    createdAt: number

queue/
  {gameMode}/
    {playerId}/
      playerId: string
      timestamp: number
      gameMode: string
```

## Adding New Features

### Adding a New Component
1. Create component file in appropriate folder
2. Export from component file
3. Import in parent component
4. Add necessary props and callbacks

### Adding a New Hook
1. Create hook file in `hooks/` folder
2. Implement hook logic with proper dependencies
3. Export hook function
4. Import and use in component

### Adding a New Game Rule
1. Add logic to `chessLogic.js`
2. Update `getPossibleMoves()` or validation functions
3. Update Firebase structure if needed
4. Test in both local and multiplayer modes

## Performance Considerations

- **Board rendering**: Only re-renders when position changes
- **Move validation**: Computed only for selected piece
- **Firebase**: Debounced timer updates to reduce writes
- **Visibility**: Set-based lookup for O(1) checks

## Testing Strategy

- **Unit tests**: Pure functions in chessLogic.js
- **Integration tests**: Hooks with mocked dependencies
- **E2E tests**: Full game flows
- **Manual testing**: Both local and multiplayer modes
