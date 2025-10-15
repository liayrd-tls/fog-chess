# Firebase Setup Guide

To enable multiplayer functionality, you need to configure Firebase Realtime Database.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Create a Realtime Database

1. In your Firebase project, go to "Build" > "Realtime Database"
2. Click "Create Database"
3. Choose a location (closest to your users)
4. Start in **test mode** (you can secure it later)
5. Click "Enable"

## Step 3: Get Your Firebase Config

1. Go to Project Settings (gear icon) > "General"
2. Scroll down to "Your apps"
3. Click the web icon `</>` to add a web app
4. Register your app with a nickname (e.g., "Fog Chess")
5. Copy the `firebaseConfig` object

## Step 4: Update src/firebase.js

Replace the placeholder values in `src/firebase.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Configure Security Rules (Optional but Recommended)

In Firebase Console > Realtime Database > Rules, you can add security rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["createdAt"]
      }
    }
  }
}
```

For production, you should add more restrictive rules to prevent abuse.

## Step 6: Test Multiplayer

1. Open the app at `http://localhost:5173`
2. Click "Create Room"
3. Copy the room code
4. Open a new browser window/tab (or incognito mode)
5. Click "Join Room" and paste the code
6. Start playing!

## Features

- **Room-based multiplayer**: Each game has a unique room code
- **Real-time synchronization**: Moves sync instantly between players
- **Turn-based gameplay**: Only the current player can move
- **Fog of war**: Each player sees only their own perspective
- **Game mode selection**: Room creator can change modes mid-game

## Troubleshooting

### "Failed to create room" error
- Check that your Firebase config is correct in `src/firebase.js`
- Verify that Realtime Database is enabled in Firebase Console
- Check browser console for specific error messages

### Room not syncing
- Ensure both players are connected to the internet
- Check Firebase Console > Realtime Database to see if data is being written
- Verify database rules allow read/write access

### "Room not found" error
- Double-check the room code is copied correctly
- Room codes are case-sensitive
- Make sure the room creator's browser is still open

## Cost

Firebase Realtime Database has a generous free tier:
- 1 GB stored data
- 10 GB/month downloaded data
- 100 simultaneous connections

For a chess game, this is plenty for casual use!
