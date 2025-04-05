import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  EmailAuthProvider, 
  linkWithCredential 
} from "firebase/auth";

// 🔹 Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCWA8Dq1EnBiYw04p-9rjqVifvA-0BeQK4",
    authDomain: "code-editor-ec330.firebaseapp.com",
    projectId: "code-editor-ec330",
    storageBucket: "code-editor-ec330.firebasestorage.app",
    messagingSenderId: "723702827636",
    appId: "1:723702827636:web:8d4b0774afc5b116be5f21",
    measurementId: "G-6XK2SB1SYJ"
  };

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 🔹 Google Sign-In & Save Password
export const signInWithGoogle = async (password) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (password) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential); // Link Google account with password
      console.log("Password linked successfully!");
    }

    return user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    return null;
  }
};

// 🔹 Normal Email Sign-Up
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email Sign-Up Error:", error);
    return null;
  }
};

// 🔹 Normal Email Sign-In
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email Sign-In Error:", error);
    return null;
  }
};

export { auth };
