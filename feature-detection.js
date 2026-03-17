// feature-detection.js

function checkPWASupport() {
  const features = {
    // Core
    'Manifest ID': 'id' in document.querySelector('link[rel="manifest"]')?.manifest || false,
    'Service Worker': 'serviceWorker' in navigator,
    'Web App Install': 'BeforeInstallPromptEvent' in window,
    
    // Display
    'Display Override': 'display_override' in (document.querySelector('link[rel="manifest"]')?.manifest || {}),
    'Window Controls Overlay': 'windowControlsOverlay' in navigator,
    'Tabbed Mode': 'display_mode' in document.documentElement.style,
    
    // Launch & Navigation
    'Launch Handler': 'launchQueue' in window,
    'Protocol Handlers': 'registerProtocolHandler' in navigator,
    'File Handlers': 'launchParams' in window,
    
    // Sharing
    'Web Share': 'share' in navigator,
    'Share Target': 'canShare' in navigator,
    
    // Advanced
    'Edge Side Panel': 'sidePanel' in navigator,
    'Widgets': 'widget' in navigator,
    'Note Taking': 'noteTaking' in navigator
  };
  
  console.table(features);
  return features;
}

// Run on load
window.addEventListener('load', checkPWASupport);
