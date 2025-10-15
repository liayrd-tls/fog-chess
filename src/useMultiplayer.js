import { useEffect, useState } from 'react';
import { ref, set, onValue, update, push, get, remove, query, orderByChild, limitToFirst } from 'firebase/database';
import { database } from './firebase';
import { initializeBoard, sanitizeBoardForFirebase, COLORS } from './chessLogic';

export const useMultiplayer = () => {
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [queueMode, setQueueMode] = useState(null);

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
        board: sanitizeBoardForFirebase(initializeBoard()),
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
      if (!snapshot.exists()) {
        // Room was deleted - opponent left
        setError('Opponent left the game');
        setRoomId(null);
        setPlayerColor(null);
        setGameState(null);
        setOpponentConnected(false);
        return;
      }

      const data = snapshot.val();

      // Normalize board to ensure it's always a proper 8x8 array
      if (data.board) {
        const normalizedBoard = [];
        for (let i = 0; i < 8; i++) {
          normalizedBoard[i] = [];
          for (let j = 0; j < 8; j++) {
            if (data.board[i] && data.board[i][j] !== undefined) {
              normalizedBoard[i][j] = data.board[i][j];
            } else {
              normalizedBoard[i][j] = null;
            }
          }
        }
        data.board = normalizedBoard;
      }

      setGameState(data);

      // Check if opponent is connected
      const wasConnected = opponentConnected;
      let nowConnected = false;

      if (playerColor === COLORS.WHITE) {
        nowConnected = !!data.players.black;
      } else {
        nowConnected = !!data.players.white;
      }

      setOpponentConnected(nowConnected);

      // If opponent disconnected (was connected, now not)
      if (wasConnected && !nowConnected) {
        setError('Opponent left the game');
        // Delete the room after a short delay
        setTimeout(() => {
          remove(roomRef).catch(console.error);
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, [roomId, playerColor, opponentConnected]);

  // Make a move
  const makeMove = async (board, fromRow, fromCol, toRow, toCol) => {
    if (!roomId || !gameState) return false;

    try {
      const roomRef = ref(database, `rooms/${roomId}`);

      // Sanitize board to ensure no undefined values
      const sanitizedBoard = sanitizeBoardForFirebase(board);

      await update(roomRef, {
        board: sanitizedBoard,
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
        board: sanitizeBoardForFirebase(initializeBoard()),
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

  // Auto match - find or create match
  const autoMatch = async (gameMode = 'casual') => {
    if (!playerId) return;

    try {
      setError(null);
      setSearching(true);
      setQueueMode(gameMode);

      // Check if anyone is waiting in this mode
      const queueRef = ref(database, `queue/${gameMode}`);
      const snapshot = await get(queueRef);

      if (snapshot.exists()) {
        // Someone is waiting! Match with them
        const waitingPlayers = snapshot.val();
        const waitingPlayerId = Object.keys(waitingPlayers)[0];
        const waitingPlayerData = waitingPlayers[waitingPlayerId];

        // Don't match with yourself
        if (waitingPlayerId === playerId) {
          // Just wait in queue
          const myQueueRef = ref(database, `queue/${gameMode}/${playerId}`);
          await set(myQueueRef, {
            playerId,
            timestamp: Date.now(),
            gameMode
          });
          return;
        }

        // Create room and match
        const roomsRef = ref(database, 'rooms');
        const newRoomRef = push(roomsRef);
        const newRoomId = newRoomRef.key;

        const initialState = {
          board: sanitizeBoardForFirebase(initializeBoard()),
          currentPlayer: COLORS.WHITE,
          gameMode,
          players: {
            white: waitingPlayerData.playerId,
            black: playerId
          },
          createdAt: Date.now(),
          lastMove: null
        };

        await set(newRoomRef, initialState);

        // Remove both players from queue
        await remove(ref(database, `queue/${gameMode}/${waitingPlayerId}`));
        await remove(ref(database, `queue/${gameMode}/${playerId}`));

        // Join as black player
        setRoomId(newRoomId);
        setPlayerColor(COLORS.BLACK);
        setSearching(false);
        setQueueMode(null);

        return newRoomId;
      } else {
        // No one waiting, add to queue
        const myQueueRef = ref(database, `queue/${gameMode}/${playerId}`);
        await set(myQueueRef, {
          playerId,
          timestamp: Date.now(),
          gameMode
        });
      }
    } catch (err) {
      setError('Failed to auto match: ' + err.message);
      console.error('Auto match error:', err);
      setSearching(false);
      setQueueMode(null);
    }
  };

  // Listen for match while in queue
  useEffect(() => {
    if (!searching || !playerId || !queueMode || roomId) return;

    const queueRef = ref(database, `queue/${queueMode}`);

    const unsubscribe = onValue(queueRef, async (snapshot) => {
      // Check if we're still in the queue
      const waitingPlayers = snapshot.val();
      const playerIds = waitingPlayers ? Object.keys(waitingPlayers) : [];

      // If we're not in the queue anymore, we've been matched!
      if (!playerIds.includes(playerId)) {
        // Look for a recently created room where we're a player
        const roomsRef = ref(database, 'rooms');
        const roomsSnapshot = await get(roomsRef);

        if (roomsSnapshot.exists()) {
          const rooms = roomsSnapshot.val();
          for (const [id, room] of Object.entries(rooms)) {
            if (
              room.players &&
              (room.players.white === playerId || room.players.black === playerId) &&
              Date.now() - room.createdAt < 10000 // Created in last 10 seconds
            ) {
              // Found our room!
              setRoomId(id);
              setPlayerColor(room.players.white === playerId ? COLORS.WHITE : COLORS.BLACK);
              setSearching(false);
              setQueueMode(null);
              break;
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [searching, playerId, queueMode, roomId]);

  // Cleanup queue on unmount
  useEffect(() => {
    return () => {
      if (playerId && queueMode) {
        remove(ref(database, `queue/${queueMode}/${playerId}`)).catch(console.error);
      }
    };
  }, [playerId, queueMode]);

  // Cancel search
  const cancelSearch = async () => {
    if (!playerId || !queueMode) return;

    try {
      await remove(ref(database, `queue/${queueMode}/${playerId}`));
      setSearching(false);
      setQueueMode(null);
    } catch (err) {
      console.error('Cancel search error:', err);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    if (!roomId || !playerColor) {
      setRoomId(null);
      setPlayerColor(null);
      setGameState(null);
      setOpponentConnected(false);
      setError(null);
      return;
    }

    try {
      const roomRef = ref(database, `rooms/${roomId}`);

      // Remove this player from the room
      if (playerColor === COLORS.WHITE) {
        await update(roomRef, { 'players/white': null });
      } else {
        await update(roomRef, { 'players/black': null });
      }

      // Check if room is now empty and delete it
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (!data.players.white && !data.players.black) {
          await remove(roomRef);
        }
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    }

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
    searching,
    createRoom,
    joinRoom,
    autoMatch,
    cancelSearch,
    makeMove,
    resetGame,
    changeGameMode,
    leaveRoom
  };
};
