// Vercel Speed Insights initialization
// Using dynamic import to load the module from node_modules or CDN
(async function initSpeedInsights() {
  try {
    // Try to import from node_modules
    const { injectSpeedInsights } = await import('./node_modules/@vercel/speed-insights/dist/index.mjs');
    
    // Initialize Speed Insights for the calculator app
    injectSpeedInsights({
      // Automatically track performance metrics
      // Data will only be collected in production on Vercel
      debug: false
    });
  } catch (error) {
    console.warn('Speed Insights could not be loaded:', error.message);
  }
})();
