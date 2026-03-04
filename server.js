require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Modelos
const Usuario = require('./models/Usuario');
const Mascota = require('./models/Mascota');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// --- RUTAS DE USUARIO (Las que ya tenías) ---

app.post('/registrar', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) return res.status(400).json({ mensaje: "Este email ya está registrado." });

        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({ nombre, email, password: passwordHasheada });
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: "¡Usuario creado con éxito! Ya puedes iniciar sesión." });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al registrar el usuario." });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(400).json({ mensaje: "Usuario o contraseña incorrectos." });

        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) return res.status(400).json({ mensaje: "Usuario o contraseña incorrectos." });

        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: "Bienvenido de nuevo", token, nombre: usuario.nombre });
    } catch (error) {
        res.status(500).json({ mensaje: "Error en el inicio de sesión." });
    }
});

// --- RUTA DE PUBLICACIÓN PROTEGIDA ---

app.post('/publicar-perdido', upload.single('petFoto'), async (req, res) => {
    try {
        // 1. Verificamos si hay un token en la cabecera
        const token = req.headers['authorization'];
        if (!token) return res.status(401).json({ mensaje: "Debes iniciar sesión para publicar." });

        // 2. Validamos el token
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'CLAVE_SECRETA_SUPER_SEGURA');

        const ubicacion = JSON.parse(req.body.ubicacion);

        const nuevaMascota = new Mascota({
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            descripcion: req.body.descripcion,
            ubicacion: ubicacion,
            foto: req.file ? req.file.path : "",
            autor: verificado.id, // <--- Aquí guardamos quién la subió
            fecha: new Date().toLocaleDateString()
        });

        await nuevaMascota.save();
        res.status(200).send({ mensaje: "¡Mascota publicada con éxito!" });
    } catch (error) {
        console.error(error);
        res.status(401).json({ mensaje: "Token no válido o sesión expirada." });
    }
});

app.get('/obtener-mascotas', async (req, res) => {
    try {
        const mascotas = await Mascota.find();
        res.json(mascotas);
    } catch (error) {
        res.status(500).send({ mensaje: "Error al obtener datos" });
    }
});

// --- RUTA PARA ELIMINAR UNA MASCOTA ---
app.delete('/eliminar-mascota/:id', async (req, res) => {
    try {
        const token = req.headers['authorization'];
        if (!token) return res.status(401).json({ mensaje: "No autorizado" });

        // Verificamos quién es el usuario
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscamos la mascota
        const mascota = await Mascota.findById(req.params.id);
        if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada" });

        // SEGURIDAD: Solo el autor puede borrarla
        if (mascota.autor.toString() !== verificado.id) {
            return res.status(403).json({ mensaje: "No tienes permiso para borrar esto" });
        }

        await Mascota.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Publicación eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar" });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
});