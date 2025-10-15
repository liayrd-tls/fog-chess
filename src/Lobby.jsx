import { useState } from 'react';
import './Lobby.css';

function Lobby({ onCreateRoom, onJoinRoom, onPlayLocal, error }) {
  const [roomCode, setRoomCode] = useState('');
  const [selectedMode, setSelectedMode] = useState('casual');

  const handleCreateRoom = async () => {
    await onCreateRoom(selectedMode);
  };

  const handleJoinRoom = async () => {
    if (roomCode.trim()) {
      await onJoinRoom(roomCode.trim());
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1>Fog Chess</h1>
        <p className="lobby-subtitle">Chess with fog of war mechanics</p>

        {error && <div className="error-message">{error}</div>}

        <div className="lobby-section">
          <h2>Game Mode</h2>
          <div className="mode-selector-lobby">
            <button
              className={selectedMode === 'casual' ? 'active' : ''}
              onClick={() => setSelectedMode('casual')}
            >
              <span className="mode-title">Casual</span>
              <span className="mode-desc">All pieces visible</span>
            </button>
            <button
              className={selectedMode === 'fog' ? 'active' : ''}
              onClick={() => setSelectedMode('fog')}
            >
              <span className="mode-title">Fog (1sq)</span>
              <span className="mode-desc">1 square radius</span>
            </button>
            <button
              className={selectedMode === 'movement' ? 'active' : ''}
              onClick={() => setSelectedMode('movement')}
            >
              <span className="mode-title">Movement</span>
              <span className="mode-desc">See possible moves</span>
            </button>
          </div>
        </div>

        <div className="lobby-section">
          <h2>Multiplayer</h2>
          <div className="lobby-actions">
            <button className="lobby-btn primary" onClick={handleCreateRoom}>
              Create Room
            </button>

            <div className="join-room">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button className="lobby-btn" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="lobby-section">
          <button className="lobby-btn secondary" onClick={onPlayLocal}>
            Play Local (Same Device)
          </button>
        </div>

        <div className="game-modes-info">
          <div className="info-item">
            <strong>Casual:</strong> Standard chess with all pieces visible
          </div>
          <div className="info-item">
            <strong>Fog (1sq):</strong> Enemy pieces hidden in fog, only 1 square radius visible
          </div>
          <div className="info-item">
            <strong>Movement:</strong> Visibility reveals all squares where your pieces can move
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
