// Esperamos a que el HTML cargue completamente
document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleccionamos los enlaces de la barra de navegación
    const linkPerdidos = document.getElementById('link-perdidos');
    const linkEncontrados = document.getElementById('link-encontrados');
    const linkAdopcion = document.getElementById('link-adopcion');

    // 2. Seleccionamos las secciones de contenido
    const secPerdidos = document.getElementById('sec-perdidos');
    const secEncontrados = document.getElementById('sec-encontrados');
    const secAdopcion = document.getElementById('sec-adopcion');

    // Función para ocultar todas las secciones
    function ocultarTodas() {
        secPerdidos.classList.add('d-none');
        secEncontrados.classList.add('d-none');
        secAdopcion.classList.add('d-none');

        // Quitamos el estado "active" de todos los links
        linkPerdidos.classList.remove('active');
        linkEncontrados.classList.remove('active');
        linkAdopcion.classList.remove('active');
    }

    // 3. Programamos los clics
    linkPerdidos.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que la página recargue
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

    // CONFIGURACIÓN DEL MAPA
    // [51.505, -0.09] son coordenadas de ejemplo, luego las cambiaremos a tu ciudad
    const map = L.map('mapa').setView([-34.6037, -58.3816], 13);

    // Cargamos las "piezas" del mapa (los dibujos de las calles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Variable global para mantener un solo marcador a la vez
    let marcadorTemporal = null;

    map.on('click', (e) => {
        // 1. Si ya existe un círculo en el mapa, lo eliminamos
        if (marcadorTemporal) {
            map.removeLayer(marcadorTemporal);
        }

        // 2. Guardamos la nueva ubicación
        ubicacionSeleccionada = e.latlng;

        // 3. Creamos el nuevo círculo y lo asignamos a la variable
        marcadorTemporal = L.circle(ubicacionSeleccionada, {
            color: '#ff0000',
            fillColor: '#f03',
            fillOpacity: 0.4,
            radius: 200 // Tus 2 cuadras de seguridad
        }).addTo(map);

        // Opcional: Agregar un botón para borrar manualmente dentro del globito
        marcadorTemporal.bindPopup(`
        <b>Zona marcada</b><br>
        <button class="btn btn-sm btn-outline-danger mt-2" onclick="borrarMarcador()">Borrar zona</button>
    `);

        console.log("Nueva ubicación única capturada:", ubicacionSeleccionada);
    });

    // Función global para que el botón del Popup funcione
    window.borrarMarcador = function () {
        if (marcadorTemporal) {
            map.removeLayer(marcadorTemporal);
            marcadorTemporal = null;
            ubicacionSeleccionada = null;
        }
    };
    const formPublicar = document.getElementById('formPublicar');

    formPublicar.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!ubicacionSeleccionada) {
            alert("Por favor, marca la zona en el mapa.");
            return;
        }

        const nuevaPublicacion = {
            nombre: document.getElementById('petNombre').value,
            tipo: document.getElementById('petTipo').value,
            descripcion: document.getElementById('petDesc').value,
            ubicacion: ubicacionSeleccionada, // Lat y Lng del mapa
            fecha: new Date().toLocaleDateString()
        };

        // ENVIAR AL SERVIDOR
        fetch('/publicar-perdido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaPublicacion)
        })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje);
                // Limpiamos y cerramos
                if (marcadorTemporal) map.removeLayer(marcadorTemporal);
                bootstrap.Modal.getInstance(document.getElementById('modalPublicar')).hide();
                formPublicar.reset();
            })
            .catch(err => console.error("Error al publicar:", err));
    });

    let ubicacionSeleccionada = null; // Aquí guardaremos la latitud y longitud


    // Escuchar clics en el mapa
    map.on('click', (e) => {
        // 1. Guardamos la ubicación del clic
        ubicacionSeleccionada = e.latlng;

        // 2. Si ya había un círculo temporal, lo borramos para poner el nuevo
        if (marcadorTemporal) {
            map.removeLayer(marcadorTemporal);
        }

        // 3. Dibujamos el círculo donde el usuario hizo clic
        marcadorTemporal = L.circle(ubicacionSeleccionada, {
            color: '#ff0000',
            fillColor: '#f03',
            fillOpacity: 0.4,
            radius: 200 // Las 2 cuadras de seguridad
        }).addTo(map);

        console.log("Coordenadas capturadas:", ubicacionSeleccionada);
    });

    // Función para cargar los reportes existentes desde el servidor
    function cargarMascotasDelServidor() {
        fetch('/obtener-mascotas')
            .then(res => res.json())
            .then(mascotas => {
                mascotas.forEach(mascota => {
                    // Dibujamos un círculo por cada mascota guardada
                    // Usamos color AZUL para distinguirlas de tu marca actual
                    L.circle(mascota.ubicacion, {
                        color: '#0000FF',
                        fillColor: '#007bff',
                        fillOpacity: 0.2,
                        radius: 200
                    }).addTo(map)
                        // Dentro de cargarMascotasDelServidor, en la parte del bindPopup:
                        .bindPopup(`
    <div style="text-align:center">
        <strong>Mascota: ${mascota.nombre}</strong><br>
        <img src="${mascota.foto}" alt="Foto de mascota" style="width:100%; max-height:150px; object-fit:cover; border-radius:10px; margin: 10px 0;">
        <br>
        <p>${mascota.descripcion}</p>
        <small>Publicado el: ${mascota.fecha}</small> </div>
            `);
                });
            })
            .catch(err => console.error("Error al cargar mascotas:", err));
    }

    // Llamamos a la función apenas carga la página para ver qué hay en la base de datos
    cargarMascotasDelServidor();
});