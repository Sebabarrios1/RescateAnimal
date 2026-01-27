// Esperamos a que el HTML cargue completamente
document.addEventListener('DOMContentLoaded', () => {

    // 1. SISTEMA DE NAVEGACIÓN
    const linkPerdidos = document.getElementById('link-perdidos');
    const linkEncontrados = document.getElementById('link-encontrados');
    const linkAdopcion = document.getElementById('link-adopcion');

    const secPerdidos = document.getElementById('sec-perdidos');
    const secEncontrados = document.getElementById('sec-encontrados');
    const secAdopcion = document.getElementById('sec-adopcion');

    function ocultarTodas() {
        secPerdidos.classList.add('d-none');
        secEncontrados.classList.add('d-none');
        secAdopcion.classList.add('d-none');
        linkPerdidos.classList.remove('active');
        linkEncontrados.classList.remove('active');
        linkAdopcion.classList.remove('active');
    }

    linkPerdidos.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarTodas();
        secPerdidos.classList.remove('d-none');
        linkPerdidos.classList.add('active');
    });

    linkEncontrados.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarTodas();
        secEncontrados.classList.remove('d-none');
        linkEncontrados.classList.add('active');
    });

    linkAdopcion.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarTodas();
        secAdopcion.classList.remove('d-none');
        linkAdopcion.classList.add('active');
    });

    console.log("Sistema de navegación listo 🐾");

    // 2. CONFIGURACIÓN DEL MAPA
    // Iniciamos en Santa Fe (puedes ajustar las coordenadas si prefieres)
    const map = L.map('mapa').setView([-31.6107, -60.6973], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marcadorTemporal = null;
    let ubicacionSeleccionada = null;

    map.on('click', (e) => {
        if (marcadorTemporal) {
            map.removeLayer(marcadorTemporal);
        }

        ubicacionSeleccionada = e.latlng;

        marcadorTemporal = L.circle(ubicacionSeleccionada, {
            color: '#ff0000',
            fillColor: '#f03',
            fillOpacity: 0.4,
            radius: 200
        }).addTo(map);

        marcadorTemporal.bindPopup(`
            <b>Zona marcada</b><br>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="borrarMarcador()">Borrar zona</button>
        `);

        console.log("Ubicación capturada:", ubicacionSeleccionada);
    });

    window.borrarMarcador = function () {
        if (marcadorTemporal) {
            map.removeLayer(marcadorTemporal);
            marcadorTemporal = null;
            ubicacionSeleccionada = null;
        }
    };

    // 3. ENVÍO DEL FORMULARIO (SOPORTE PARA FOTOS)
    const formPublicar = document.getElementById('formPublicar');

    formPublicar.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!ubicacionSeleccionada) {
            alert("Por favor, marca la zona en el mapa.");
            return;
        }

        // Usamos FormData para empaquetar la imagen real para Cloudinary
        const formData = new FormData();
        formData.append('nombre', document.getElementById('petNombre').value);
        formData.append('tipo', document.getElementById('petTipo').value);
        formData.append('descripcion', document.getElementById('petDesc').value);
        formData.append('ubicacion', JSON.stringify(ubicacionSeleccionada));
        formData.append('petFoto', document.getElementById('petFoto').files[0]);

        fetch('/publicar-perdido', {
            method: 'POST',
            body: formData // No enviamos headers de JSON, FormData lo hace solo
        })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje);
                if (marcadorTemporal) map.removeLayer(marcadorTemporal);
                bootstrap.Modal.getInstance(document.getElementById('modalPublicar')).hide();
                formPublicar.reset();
                location.reload(); // Recargamos para ver la nueva mascota con su foto
            })
            .catch(err => console.error("Error al publicar:", err));
    });

    // 4. CARGAR MASCOTAS DESDE LA DB
    function cargarMascotasDelServidor() {
        fetch('/obtener-mascotas')
            .then(res => res.json())
            .then(mascotas => {
                mascotas.forEach(mascota => {
                    L.circle(mascota.ubicacion, {
                        color: '#0000FF',
                        fillColor: '#007bff',
                        fillOpacity: 0.2,
                        radius: 200
                    }).addTo(map)
                        .bindPopup(`
                        <div style="text-align:center">
                            <strong>Mascota: ${mascota.nombre}</strong><br>
                            <img src="${mascota.foto}" alt="Foto" style="width:100%; max-height:150px; object-fit:cover; border-radius:10px; margin: 10px 0;">
                            <p>${mascota.descripcion}</p>
                            <small>Publicado: ${mascota.fecha}</small>
                        </div>
                    `);
                });
            })
            .catch(err => console.error("Error al cargar mascotas:", err));
    }

    cargarMascotasDelServidor();
});