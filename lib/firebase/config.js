import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// In a production app, these values would be environment variables
const firebaseConfig = {
  apiKey: "AIzaSyC1I_hYoiuc-IEMNwaSss41CD7jnaEpy7Q",
  authDomain: "the-smith-agency.firebaseapp.com",
  projectId: "the-smith-agency",
  storageBucket: "the-smith-agency.firebasestorage.app",
  messagingSenderId: "1048512215721",
  appId: "1:1048512215721:web:c092a7c008d61c4c7d47b8",
  measurementId: "G-QTTX3YDDMP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };