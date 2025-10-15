import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyUzyqxdlMT1qqasLGBa03SvM2eovZ2I4",
  authDomain: "fogchess-d8115.firebaseapp.com",
  databaseURL: "https://fogchess-d8115-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "fogchess-d8115",
  storageBucket: "fogchess-d8115.firebasestorage.app",
  messagingSenderId: "260573483785",
  appId: "1:260573483785:web:1848280c3e9a0ebc1179d8",
  measurementId: "G-XXGZXKVHRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
