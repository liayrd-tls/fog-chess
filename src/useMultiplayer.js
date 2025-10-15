import { useEffect, useState } from 'react';
import { ref, set, onValue, update, push, get } from 'firebase/database';
import { database } from './firebase';
import { initializeBoard, COLORS } from './chessLogic';

export const useMultiplayer = () => {
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Generate unique player ID on mount
    const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPlayerId(id);
  }, []);

  // Create a new game room
  const createRoom = async (gameMode = 'casual') => {
    try {
      setError(null);
      const roomsRef = ref(database, 'rooms');
      const newRoomRef = push(roomsRef);
      const newRoomId = newRoomRef.key;

      const initialState = {
        board: initializeBoard(),
        currentPlayer: COLORS.WHITE,
        gameMode,
        players: {
          white: playerId,
          black: null
        },
        createdAt: Date.now(),
        lastMove: null
      };

      await set(newRoomRef, initialState);
      setRoomId(newRoomId);
      setPlayerColor(COLORS.WHITE);

      return newRoomId;
    } catch (err) {
      setError('Failed to create room: ' + err.message);
      console.error('Create room error:', err);
      return null;
    }
  };

  // Join an existing game room
  const joinRoom = async (roomIdToJoin) => {
    try {
      setError(null);
      const roomRef = ref(database, `rooms/${roomIdToJoin}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError('Room not found');
        return false;
      }

      const roomData = snapshot.val();

      if (roomData.players.black) {
        setError('Room is full');
        return false;
      }

      // Join as black player
      await update(roomRef, {
        'players/black': playerId
      });

      setRoomId(roomIdToJoin);
      setPlayerColor(COLORS.BLACK);
      return true;
    } catch (err) {
      setError('Failed to join room: ' + err.message);
      console.error('Join room error:', err);
      return false;
    }
  };

  // Listen to game state changes
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(database, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGameState(data);

        // Check if opponent is connected
        if (playerColor === COLORS.WHITE) {
          setOpponentConnected(!!data.players.black);
        } else {
          setOpponentConnected(!!data.players.white);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, playerColor]);

  // Make a move
  const makeMove = async (board, fromRow, fromCol, toRow, toCol) => {
    if (!roomId || !gameState) return false;

    try {
      const roomRef = ref(database, `rooms/${roomId}`);

      await update(roomRef, {
        board,
        currentPlayer: gameState.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE,
        lastMove: {
          from: [fromRow, fromCol],
          to: [toRow, toCol],
          timestamp: Date.now()
        }
      });

      return true;
    } catch (err) {
      setError('Failed to make move: ' + err.message);
      console.error('Make move error:', err);
      return false;
    }
  };

  // Reset game
  const resetGame = async () => {
    if (!roomId) return;

    try {
      const roomRef = ref(database, `rooms/${roomId}`);
      await update(roomRef, {
        board: initializeBoard(),
        currentPlayer: COLORS.WHITE,
        lastMove: null
      });
    } catch (err) {
      setError('Failed to reset game: ' + err.message);
      console.error('Reset game error:', err);
    }
  };

  // Change game mode
  const changeGameMode = async (newMode) => {
    if (!roomId) return;

    try {
      const roomRef = ref(database, `rooms/${roomId}`);
      await update(roomRef, {
        gameMode: newMode
      });
    } catch (err) {
      setError('Failed to change game mode: ' + err.message);
      console.error('Change game mode error:', err);
    }
  };

  // Leave room
  const leaveRoom = () => {
    setRoomId(null);
    setPlayerColor(null);
    setGameState(null);
    setOpponentConnected(false);
    setError(null);
  };

  return {
    roomId,
    playerId,
    playerColor,
    gameState,
    opponentConnected,
    error,
    createRoom,
    joinRoom,
    makeMove,
    resetGame,
    changeGameMode,
    leaveRoom
  };
};
