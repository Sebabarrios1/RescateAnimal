const mongoose = require('mongoose');

const MascotaSchema = new mongoose.Schema({
    nombre: String,
    tipo: { type: String, required: true },
    descripcion: String,
    ubicacion: {
        lat: Number,
        lng: Number
    },
    fecha: { type: String, default: new Date().toLocaleDateString() },
    foto: String
});

module.exports = mongoose.model('Mascota', MascotaSchema);