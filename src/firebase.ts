import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,connectAuthEmulator,signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const configured=Object.values(config).every(Boolean);
const app=initializeApp(configured ? config : {apiKey:'unconfigured',authDomain:'unconfigured.invalid',projectId:'unconfigured',appId:'unconfigured'});
export const auth=getAuth(app); export const db=getFirestore(app);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());

export const emulator=import.meta.env.VITE_USE_EMULATOR==='true';
if(emulator){
 if(!config.projectId?.startsWith('demo-'))throw new Error('Emulator requires a demo project');
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 connectFirestoreEmulator(db,'127.0.0.1',8080);
}
export const testLogin=()=>signInWithEmailAndPassword(auth,import.meta.env.VITE_EMULATOR_TEST_EMAIL,import.meta.env.VITE_EMULATOR_TEST_PASSWORD);
