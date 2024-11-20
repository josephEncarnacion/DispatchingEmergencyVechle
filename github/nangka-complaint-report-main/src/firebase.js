import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv9n_EN9d7QZ37vyA5olAXwR3eFmJpaPs",
  authDomain: "dispatching-vehicle.firebaseapp.com",
  projectId: "dispatching-vehicle",
  storageBucket: "dispatching-vehicle.appspot.com",
  messagingSenderId: "832824890246",
  appId: "1:832824890246:web:1027e8109eb5a072899207"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };