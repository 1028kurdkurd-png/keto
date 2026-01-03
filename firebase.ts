import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBz8nI_fxRsl1V-UVPtscUg-KYutb1yGZs",
    authDomain: "mazi-keto.firebaseapp.com",
    projectId: "mazi-keto",
    storageBucket: "mazi-keto.firebasestorage.app",
    messagingSenderId: "349681021322",
    appId: "1:349681021322:web:7808ac3b69bead5bd9d873",
    measurementId: "G-9JCZE6K1GF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const reauthWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
};

import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.log('Persistence not supported by browser');
    }
});
