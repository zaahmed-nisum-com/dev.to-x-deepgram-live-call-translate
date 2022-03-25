// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import 'firebase/compat/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyBkvlGen7TCj1ZehyccPYgRtTTUB-IyTyk",
    authDomain: "dev-x-deepg.firebaseapp.com",
    projectId: "dev-x-deepg",
    storageBucket: "dev-x-deepg.appspot.com",
    messagingSenderId: "340997743316",
    appId: "1:340997743316:web:05e9acc61fc29a5160d141",
    measurementId: "G-ZWMSWNWQS7"
};

export const firebaseInstance = firebase.initializeApp(firebaseConfig);