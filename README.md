# Fog Chess ♟️

A modern chess game with fog of war mechanics, built with React and Firebase. Play locally or online with real-time multiplayer.

## 🎮 Features

### Game Modes
- **Casual**: Traditional chess with all pieces visible
- **Fog (1 square)**: Fog of war - only see 1 square radius around your pieces
- **Movement**: Visibility reveals all squares where your pieces can move (default)

### Core Features
- ✅ Full chess rules implementation (including castling, en passant, promotion)
- ✅ Check, checkmate, and stalemate detection
- ✅ 10-minute timer per player with timeout handling
- ✅ Real-time multiplayer via Firebase
- ✅ Auto-matching system
- ✅ Room-based multiplayer (create/join with room codes)
- ✅ Material advantage display
- ✅ Last move highlighting
- ✅ Board rotation for black player
- ✅ Mobile-responsive design
- ✅ Progressive Web App (PWA) support

## 🏗️ Architecture

This project follows a modular architecture with clear separation of concerns:

### Component Structure
```
src/
├── components/
│   ├── Board/          # Chess board UI
│   ├── Game/           # Game controls and info
│   ├── Dialogs/        # Modal dialogs
│   └── Multiplayer/    # Multiplayer UI
├── hooks/              # Custom React hooks
├── utils/              # Constants and utilities
└── chessLogic.js       # Core chess rules
```

### Key Modules

**Components**
- `Board` - Chess board with fog of war rendering
- `CapturedPiecesBar` - Shows captured pieces and timer
- `GameControls` - Game action buttons
- `PromotionDialog` - Pawn promotion UI
- `GameEndDialog` - Game over screen with results

**Hooks**
- `useGameState` - Local game state management
- `useTimer` - Timer countdown and timeout detection
- `useGameEnd` - Checkmate/stalemate detection
- `useMoveHandler` - Move validation and execution
- `useMultiplayer` - Firebase real-time sync

**Logic**
- `chessLogic.js` - Pure chess rule implementations
- Move generation, validation, and execution
- Check detection and game status

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd fog-chess
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database
   - Copy your Firebase config
   - Create `src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

4. Start development server
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Usage

### Local Game
1. Click "Play Local (Same Device)"
2. Select game mode
3. Play chess!

### Multiplayer

**Create Room**
1. Select game mode
2. Click "Create Room"
3. Share room code with opponent

**Join Room**
1. Get room code from friend
2. Enter code and click "Join Room"

**Auto Match**
1. Select game mode
2. Click "Auto Match"
3. Wait for opponent

## 🧪 Code Quality

### Best Practices
- ✅ Component-based architecture
- ✅ Custom hooks for logic separation
- ✅ Pure functions for game logic
- ✅ Prop validation
- ✅ Error handling
- ✅ Performance optimizations

### Code Organization
- Small, focused components (< 100 lines)
- Single responsibility principle
- Separation of concerns (UI / Logic / State)
- Reusable utilities
- Clear naming conventions

## 📱 Mobile Support

Fully responsive design with:
- Touch-friendly interface
- Dynamic viewport height (dvh)
- Optimized for screens 320px - 1920px
- PWA installable on mobile devices

## 🔧 Tech Stack

- **Frontend**: React 19
- **Styling**: CSS3 with responsive breakpoints
- **Backend**: Firebase Realtime Database
- **Build Tool**: Vite 7
- **PWA**: Vite PWA Plugin

## 📦 Project Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Keep components small and focused
- Write descriptive commit messages
- Test in both local and multiplayer modes
- Ensure mobile responsiveness

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Chess piece symbols from Unicode
- Fog of war concept inspired by strategy games
- Firebase for real-time infrastructure

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review ARCHITECTURE.md for technical details

---

**Enjoy playing Fog Chess! ♟️**
