import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const configured=Object.values(config).every(Boolean);
const app=initializeApp(configured ? config : {apiKey:'unconfigured',authDomain:'unconfigured.invalid',projectId:'unconfigured',appId:'unconfigured'});
export const auth=getAuth(app); export const db=getFirestore(app);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
