import { db } from '../config/firebase.js';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export class SalesModel {

    /**
     * Escucha las ventas del vendedor actual realizadas HOY.
     * @param {string} vendedorId - UID del vendedor logueado
     * @param {Function} callback - Función para enviar los datos
     */
    suscribirVentasDelDia(vendedorId, callback) {
        // 1. Calcular el rango de fechas de HOY (00:00 a 23:59)
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        // 2. Crear la consulta
        // Nota: Firestore pedirá crear un Índice Compuesto para esta query. 
        // Verás el link en la consola cuando corra por primera vez.
        const ventasRef = collection(db, "sales");
        const q = query(
            ventasRef,
            where("vendedor_id", "==", vendedorId),
            where("fecha", ">=", Timestamp.fromDate(inicioDia)),
            where("fecha", "<=", Timestamp.fromDate(finDia)),
            orderBy("fecha", "desc")
        );

        // 3. Suscripción en tiempo real
        return onSnapshot(q, (snapshot) => {
            const ventas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(ventas);
        });
    }

    /**
     * Obtiene TODAS las ventas del día de HOY (Globales).
     */
    async obtenerVentasGlobalesHoy() {
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        const ventasRef = collection(db, "sales");
        // Nota: Si esta consulta también pide índice, repetimos el proceso
        const q = query(
            ventasRef,
            where("fecha", ">=", Timestamp.fromDate(inicioDia)),
            where("fecha", "<=", Timestamp.fromDate(finDia))
        );

        const snapshot = await getDocs(q); // Usamos getDocs (una sola vez) en lugar de onSnapshot para no saturar
        return snapshot.docs.map(doc => doc.data());
    }

    /**
     * Escucha TODAS las ventas globales del día de HOY.
     * @param {Function} callback 
     */
    suscribirVentasGlobalesHoy(callback) {
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        const ventasRef = collection(db, "sales");

        // Query Global por fecha
        const q = query(
            ventasRef,
            where("fecha", ">=", Timestamp.fromDate(inicioDia)),
            where("fecha", "<=", Timestamp.fromDate(finDia))
        );

        return onSnapshot(q, (snapshot) => {
            const ventas = snapshot.docs.map(doc => doc.data());
            callback(ventas);
        });
    }
}

