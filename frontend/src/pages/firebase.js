// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv9n_EN9d7QZ37vyA5olAXwR3eFmJpaPs",
  authDomain: "dispatching-vehicle.firebaseapp.com",
  projectId: "dispatching-vehicle",
  storageBucket: "dispatching-vehicle.appspot.com",  // This field is required for Firebase Storage
  messagingSenderId: "832824890246",
  appId: "1:832824890246:web:1027e8109eb5a072899207"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };

