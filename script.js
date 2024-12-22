function downloadReel() {
  const url = document.getElementById('reelUrl').value.trim();
  
  if (!url) {
    alert('Por favor, pega un enlace válido de un reel de Instagram.');
    return;
  }
  
  // Redirige al sitio externo con el enlace prellenado
  window.open(`https://snapinsta.app/es?url=${encodeURIComponent(url)}`, '_blank');
}
