// src/config/firebase.js

// Importamos solo lo que necesitamos de Firebase (Modularidad)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Tu configuración (Cópiala de tu consola de Firebase)
  const firebaseConfig = {
    apiKey: "AIzaSyArG4Aa6OO3P0K69GKyjC9Xx4IL8OTI0uc",
    authDomain: "area-51-1cd2d.firebaseapp.com",
    projectId: "area-51-1cd2d",
    storageBucket: "area-51-1cd2d.firebasestorage.app",
    messagingSenderId: "580061746514",
    appId: "1:580061746514:web:a6c88e9be9aef4c05f568b",
    measurementId: "G-0CGWE5S2P9"
  };

// Inicializamos la App (Patrón Singleton implícito: solo se inicializa una vez al importar)
const app = initializeApp(firebaseConfig);

// Exportamos las instancias para usarlas en los Modelos
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 Firebase conectado exitosamente");

export { db, auth };