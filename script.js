async function downloadReel() {
  const url = document.getElementById('reelUrl').value.trim();
  const status = document.getElementById('status');

  if (!url) {
    alert('Por favor, pega un enlace válido de un reel de Instagram.');
    return;
  }

  status.textContent = 'Descargando... Por favor, espera.';

  try {
    const response = await fetch('https://social-media-video-downloader.p.rapidapi.com/smvd/get/instagram', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'd6eefda435msh8ae60d04d6b9b22p172e56jsn5a84a74c03bd', // Reemplaza con tu clave API
        'X-RapidAPI-Host': 'social-media-video-downloader.p.rapidapi.com'
      },
      params: {
        url: url
      }
    });

    if (!response.ok) {
      throw new Error('No se pudo descargar el video. Verifica el enlace.');
    }

    const data = await response.json();
    const videoUrl = data.url || data.video_url; // Ajusta si el campo es diferente

    // Descargar el video automáticamente
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'reel.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    status.textContent = '¡Descarga completada!';
  } catch (error) {
    console.error(error);
    status.textContent = 'Error al descargar el video. Intenta nuevamente.';
  }
}
