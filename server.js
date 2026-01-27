require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Cloudinary (Usa las keys que pusiste en Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración del almacenamiento en la nube
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mascotas_rescatadas',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});
const upload = multer({ storage: storage });

// Middlewares
app.use(express.json());
app.use(express.static(__dirname));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error Mongo:", err));

// Modelo de Mascota
const Mascota = require('./models/Mascota');

// RUTA POST: Ahora acepta una imagen ('petFoto')
app.post('/publicar-perdido', upload.single('petFoto'), async (req, res) => {
    try {
        // Parseamos la ubicación porque viene como texto desde FormData
        const ubicacion = JSON.parse(req.body.ubicacion);

        const nuevaMascota = new Mascota({
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            descripcion: req.body.descripcion,
            ubicacion: ubicacion,
            foto: req.file ? req.file.path : "", // Aquí se guarda la URL de Cloudinary
            fecha: new Date().toLocaleDateString()
        });

        await nuevaMascota.save();
        res.status(200).send({ mensaje: "¡Publicado con éxito en la nube!" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ mensaje: "Error al publicar" });
    }
});

app.get('/obtener-mascotas', async (req, res) => {
    const mascotas = await Mascota.find();
    res.json(mascotas);
});

app.listen(port, () => console.log(`🚀 Server en puerto ${port}`));