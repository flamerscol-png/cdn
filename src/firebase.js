import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCI54v1g0OicjUOZ9aCiKqgwSPZYsaEXSo",
    authDomain: "flamercoal.firebaseapp.com",
    projectId: "flamercoal",
    storageBucket: "flamercoal.firebasestorage.app",
    messagingSenderId: "973220344684",
    appId: "1:973220344684:web:612e9f476d2eb8a5797949",
    measurementId: "G-TW6R6WG9ES",
    databaseURL: "https://flamercoal-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const database = getDatabase(app);

// Database connectivity check
const checkDatabaseConnection = async () => {
    try {
        const testRef = ref(database, '.info/connected');
        await get(testRef);
        console.log("[Firebase] ✅ Database connection OK");
        return true;
    } catch (error) {
        console.error("[Firebase] ❌ Database connection FAILED:", error.message);
        console.error("[Firebase] Current databaseURL:", firebaseConfig.databaseURL);
        console.error("[Firebase] Go to https://console.firebase.google.com/project/flamercoal/database to verify the URL");
        return false;
    }
};

// Run check on load
checkDatabaseConnection();

console.log("[Firebase] Initialized with DB:", firebaseConfig.databaseURL);

export { app, analytics, auth, googleProvider, database };
