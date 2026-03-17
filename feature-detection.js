// app.js
if ('windowControlsOverlay' in navigator) {
  const overlay = navigator.windowControlsOverlay;
  
  // Check if overlay is visible
  if (overlay.visible) {
    console.log('Title bar area:', overlay.getTitlebarAreaRect());
    
    // Listen for geometry changes
    overlay.addEventListener('geometrychange', (e) => {
      console.log('New title bar rect:', e.titlebarAreaRect);
      adjustLayout(e.titlebarAreaRect);
    });
  }
}
