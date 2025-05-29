import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBviwMdDCPO1UUovvdEwBjqcSM9qb6rxCA",
  authDomain: "andreaisaacwedding.firebaseapp.com",
  databaseURL: "https://andreaisaacwedding-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "andreaisaacwedding",
  storageBucket: "andreaisaacwedding.appspot.com",
  messagingSenderId: "759825528019",
  appId: "1:759825528019:web:c15e084ff9dcefbca345026",
  measurementId: "G-N9RZJFDCMS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); 