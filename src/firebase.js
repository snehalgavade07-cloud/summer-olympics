import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyC-FPNMrbmOhzdtbv0ORBiAAnke9Csbz8c",
  authDomain: "summer-olympics-806fb.firebaseapp.com",
  projectId: "summer-olympics-806fb",
  storageBucket: "summer-olympics-806fb.firebasestorage.app",
  messagingSenderId: "495864756499",
  appId: "1:495864756499:web:ce0680bc00b40ae37342e6",
  measurementId: "G-WPKPY7CL75",
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)
