// ═══════════════════════════════════════════════════════════
//  MarquisTeacher Academy — Firebase Configuration
//  Project: marquisteacher-academy
// ═══════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyAiwhJBLgR2PXGTefJIOmY0RDaAaBXkBm0",
  authDomain:        "marquisteacher-academy.firebaseapp.com",
  projectId:         "marquisteacher-academy",
  storageBucket:     "marquisteacher-academy.firebasestorage.app",
  messagingSenderId: "750118192079",
  appId:             "1:750118192079:web:1ec61b17dbc246900788ba",
  measurementId:     "G-KT47C88TVY"
};

// Initialize Firebase (compat SDK — loaded via CDN in index.html)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
