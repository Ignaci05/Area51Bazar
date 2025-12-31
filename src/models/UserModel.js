import { auth, db } from '../config/firebase.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export class UserModel {

    // Método para iniciar sesión y obtener el rol
    async login(email, password) {
        try {
            // 1. Autenticar en Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Buscar datos extra (rol) en Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();

                // Validación extra: ¿Está activo el empleado?
                if (!userData.activo) {
                    await signOut(auth);
                    throw new Error("Usuario desactivado. Contacta al administrador.");
                }

                return { ...userData, uid: user.uid }; // Retornamos todo el objeto usuario
            } else {
                throw new Error("Usuario autenticado pero sin registro en base de datos.");
            }

        } catch (error) {
            console.error("Error en Modelo:", error);
            throw error; // Lanzamos el error para que el Controlador lo maneje
        }
    }

    async logout() {
        return await signOut(auth);
    }

    /**
     * Escucha la lista de usuarios que son Vendedores.
     */
    suscribirAEmpleados(callback) {
        const usersRef = collection(db, "users");
        // Filtramos solo los que tengan rol="vendedor"
        const q = query(usersRef, where("rol", "==", "vendedor"));

        return onSnapshot(q, (snapshot) => {
            const empleados = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            callback(empleados);
        });
    }

    /**
     * TRUCO: Crea un usuario en Auth y Firestore SIN cerrar sesión al Admin.
     */
    async crearEmpleado(datos) {
        // 1. Necesitamos la config de firebase otra vez para la app secundaria
        // (En un proyecto real, esto vendría de un archivo de config compartido, 
        //  pero por ahora puedes copiar tu config aquí o extraerla)

        // CUIDADO: Pega aquí tu MISMA config que tienes en firebase.js
        const firebaseConfig = {
            apiKey: "AIzaSyArG4Aa6OO3P0K69GKyjC9Xx4IL8OTI0uc",
            authDomain: "area-51-1cd2d.firebaseapp.com",
            projectId: "area-51-1cd2d",
            storageBucket: "area-51-1cd2d.firebasestorage.app",
            messagingSenderId: "580061746514",
            appId: "1:580061746514:web:a6c88e9be9aef4c05f568b",
            measurementId: "G-0CGWE5S2P9"
        };

        // 2. Inicializamos una app secundaria temporal
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // 3. Creamos el usuario en la App Secundaria
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, datos.email, datos.password);
            const nuevoUid = userCredential.user.uid;

            // 4. Guardamos los datos en Firestore (Usando la DB principal del Admin)
            await setDoc(doc(db, "users", nuevoUid), {
                nombre: datos.nombre,
                email: datos.email,
                rol: "vendedor",
                activo: true, // Por defecto puede entrar
                fecha_creacion: serverTimestamp(),
                ventas_totales: 0 // Inicializamos contador
            });

            // 5. Borramos la app secundaria para liberar memoria
            // (Nota: deleteApp es una promesa, pero no necesitamos esperarla obligatoriamente aquí)

            console.log("Empleado creado:", nuevoUid);
            return nuevoUid;

        } catch (error) {
            console.error("Error creando empleado:", error);
            throw error;
        }
    }

    /**
     * Actualiza datos básicos del empleado (Nombre, etc)
     */
    async editarEmpleado(uid, data) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            nombre: data.nombre
            // No editamos email/password aquí porque es complejo en Firebase Client
        });
    }

    /**
     * Elimina el registro del empleado. 
     * Efecto: El usuario ya no podrá iniciar sesión.
     */
    async eliminarEmpleado(uid) {
        const userRef = doc(db, "users", uid);
        await deleteDoc(userRef);
    }

    /**
     * Bloquea o Desbloquea el acceso a un empleado
     */
    async toggleEstadoEmpleado(uid, estadoActual) {
        const userRef = doc(db, "users", uid);
        // Simplemente invertimos el booleano (true -> false)
        await setDoc(userRef, { activo: !estadoActual }, { merge: true });
    }
}