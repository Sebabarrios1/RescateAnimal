require('dotenv').config(); // Siempre primero
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CONEXIÓN A MONGODB ATLAS (Usando la variable de entorno)
const mongoURI = process.env.MONGO_URI;
console.log("Intentando conectar a:", mongoURI); // Para verificar en la terminal

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conectado exitosamente a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// Importar el Modelo
const Mascota = require('./models/Mascota');

// RUTA: Guardar mascota en DB
app.post('/publicar-perdido', async (req, res) => {
    try {
        const nuevaMascota = new Mascota(req.body);
        await nuevaMascota.save();
        console.log("Mascota guardada en Atlas:", nuevaMascota);
        res.status(200).send({ mensaje: "¡Guardado permanentemente en la nube!" });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).send({ mensaje: "Error al guardar en la base de datos" });
    }
});

// RUTA: Obtener todas las mascotas de la DB
app.get('/obtener-mascotas', async (req, res) => {
    try {
        const mascotas = await Mascota.find();
        res.json(mascotas);
    } catch (error) {
        res.status(500).send({ mensaje: "Error al obtener mascotas" });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});