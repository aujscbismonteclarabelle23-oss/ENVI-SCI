import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC65SFtxLFHox9O5E15MU9d9M4qbmVVoZo",
  authDomain: "air-quality-e0670.firebaseapp.com",
  databaseURL:
    "https://air-quality-e0670-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "air-quality-e0670",
  storageBucket: "air-quality-e0670.firebasestorage.app",
  messagingSenderId: "764413841435",
  appId: "1:764413841435:web:f11199f6fc4072627728be",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);