import { getApp, getApps } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDv-kizOPpfKLem6r87Jj4dyZE9V4NVYyc",
  authDomain: "prepwise-f245a.firebaseapp.com",
  projectId: "prepwise-f245a",
  storageBucket: "prepwise-f245a.firebasestorage.app",
  messagingSenderId: "568821522158",
  appId: "1:568821522158:web:2d16d490586d758dc65dff",
  measurementId: "G-RHLFDHG07Q"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);