// Zoom persistence utility
(function() {
  'use strict';
  
  // Store zoom level when it changes
  let lastZoom = 1;
  
  function saveZoomLevel() {
    const currentZoom = window.devicePixelRatio || 1;
    if (Math.abs(currentZoom - lastZoom) > 0.01) {
      localStorage.setItem('browserZoomLevel', currentZoom.toString());
      lastZoom = currentZoom;
    }
  }
  
  // Restore zoom level on page load
  function restoreZoomLevel() {
    try {
      const savedZoom = localStorage.getItem('browserZoomLevel');
      if (savedZoom && savedZoom !== '1') {
        // This attempts to maintain the zoom appearance
        // Note: Direct zoom control is limited in browsers for security
        document.documentElement.style.fontSize = `${parseFloat(savedZoom) * 16}px`;
      }
    } catch (error) {
      console.log('Could not restore zoom level:', error);
    }
  }
  
  // Monitor zoom changes
  function monitorZoom() {
    // Check for zoom changes periodically
    setInterval(saveZoomLevel, 500);
    
    // Also save on various events
    window.addEventListener('resize', saveZoomLevel);
    window.addEventListener('beforeunload', saveZoomLevel);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      restoreZoomLevel();
      monitorZoom();
    });
  } else {
    restoreZoomLevel();
    monitorZoom();
  }
  
})();