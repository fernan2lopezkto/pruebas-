// Base de datos de videos (la dejamos como está)
const videos = [
    {
        id: "jfKfPfyJRdk",
        titulo: "El Evangelio",
        canal: "Paul Washer",
        categoria: "reflexion"
    },
    {
        id: "iHG0v91Dtpw",
        titulo: "Gracia a Vosotros",
        canal: "John MacArthur",
        categoria: "estudio"
    },
    // ... (resto de tus videos)
    {
        id: "2e21WW74M94",
        titulo: "Nadie Te Ama Como Yo",
        canal: "Jesús Adrián Romero",
        categoria: "musica"
    }
];

// --- SELECCIÓN DE ELEMENTOS ---
const botonesFiltro = document.querySelectorAll('.filtros-container .btn');
const videosContainer = document.querySelector('.videos-container');
// ¡NUEVO! El contenedor del reproductor principal
const videoPlayer = document.getElementById('video-player');

// --- FUNCIONES ---

/**
 * Función para mostrar el video seleccionado en el reproductor principal
 * @param {string} id - El ID del video de YouTube
 */
function mostrarVideoPrincipal(id) {
    if (!id) {
        videoPlayer.innerHTML = `<p class="text-center p-10">No hay video para mostrar, bo.</p>`;
        return;
    }

    // Creamos el HTML del iframe
    const videoHtml = `
        <iframe 
            src="https://www.youtube.com/embed/${id}?autoplay=1" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    // Lo ponemos en el contenedor
    videoPlayer.innerHTML = videoHtml;
}

/**
 * Función para renderizar los videos en la grilla
 * @param {Array} videosMostrados - El array de videos a mostrar
 */
function mostrarVideos(videosMostrados) {
    // Limpiamos el contenedor
    videosContainer.innerHTML = '';

    if (videosMostrados.length === 0) {
        videosContainer.innerHTML = '<p class="col-span-full text-center">No se encontraron videos de esta categoría.</p>';
        // Limpiamos el player si no hay videos
        mostrarVideoPrincipal(null); 
        return;
    }

    // Creamos las tarjetas
    videosMostrados.forEach(video => {
        const videoCard = document.createElement('div');
        // Usamos clases de DaisyUI que ya tenés
        videoCard.className = 'card card-compact bg-base-100 shadow-xl transition-transform hover:scale-105 cursor-pointer';
        // ¡Importante! Guardamos el ID en el data-attribute
        videoCard.dataset.id = video.id;

        videoCard.innerHTML = `
            <figure>
                <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.titulo}" />
            </figure>
            <div class="card-body">
                <h2 class="card-title text-sm">${video.titulo}</h2>
                <p class="text-xs">${video.canal}</p>
            </div>
        `;
        videosContainer.appendChild(videoCard);
    });

    // ¡NUEVO! Cargamos el primer video de la lista filtrada en el reproductor
    mostrarVideoPrincipal(videosMostrados[0].id);
}

// --- EVENT LISTENERS ---

// Listener para los botones de filtro
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', () => {
        // Marcamos el botón activo
        botonesFiltro.forEach(btn => btn.classList.replace('btn-primary', 'btn-outline'));
        boton.classList.replace('btn-outline', 'btn-primary');

        const filtro = boton.dataset.filtro;

        // Filtramos los videos
        let videosFiltrados;
        if (filtro === 'todos') {
            videosFiltrados = videos;
        } else {
            videosFiltrados = videos.filter(video => video.categoria === filtro);
        }

        // Mostramos los videos filtrados
        mostrarVideos(videosFiltrados);
    });
});


// ¡NUEVO! Listener para los clicks en las tarjetas (Usando Delegación de Eventos)
videosContainer.addEventListener('click', (e) => {
    // Buscamos la tarjeta más cercana al elemento clickeado
    const card = e.target.closest('.video-card');

    // Si no se hizo click en una tarjeta (sino en el fondo), no hacemos nada
    if (!card) return;

    // Obtenemos el ID que guardamos en el data-attribute
    const id = card.dataset.id;

    // Mostramos el video
    mostrarVideoPrincipal(id);

    // Hacemos scroll suave para que el reproductor quede a la vista
    videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
});


// --- INICIALIZACIÓN ---
// Mostramos todos los videos al cargar la página
mostrarVideos(videos);
