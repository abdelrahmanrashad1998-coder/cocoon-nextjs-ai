import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyALGK71HyO3bQ40mpAsCmUEOwHddjXEWNo",
    authDomain: "cocoon-aluminum-works.firebaseapp.com",
    projectId: "cocoon-aluminum-works",
    storageBucket: "cocoon-aluminum-works.firebasestorage.app",
    messagingSenderId: "29193226430",
    appId: "1:29193226430:web:c7a806149d4ff39ac5f6ef",
    measurementId: "G-429C9YTHBY",
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    console.error("Firebase initialization error:", error);
    // If Firebase is already initialized, get the existing app
    app = initializeApp(firebaseConfig, "cocoon-app");
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth for better network handling
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = false;

// Add network error handling with retry
let retryCount = 0;
const maxRetries = 3;

auth.onAuthStateChanged(
    (user) => {
        if (user) {
            console.log("User authenticated:", user.email);
            retryCount = 0; // Reset retry count on success
        }
    },
    (error) => {
        console.error("Auth state change error:", error);
        if (
            error.message === "auth/network-request-failed" &&
            retryCount < maxRetries
        ) {
            retryCount++;
            console.log(
                `Retrying auth state change (${retryCount}/${maxRetries})`
            );
            setTimeout(() => {
                // The listener will automatically retry
            }, 1000 * retryCount);
        }
    }
);

export default app;
