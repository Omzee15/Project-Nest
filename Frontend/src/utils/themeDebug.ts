// Theme debugging utility
export const debugTheme = () => {
  const root = document.documentElement;
  
  console.group('🎨 Theme Debug Information');
  
  // Check localStorage
  console.log('📱 Storage Information:');
  try {
    console.log('  localStorage available:', typeof Storage !== 'undefined');
    console.log('  Saved theme:', localStorage.getItem('theme'));
    console.log('  All localStorage keys:', Object.keys(localStorage));
  } catch (error) {
    console.error('  localStorage error:', error);
  }
  
  // Check CSS variables
  console.log('🎭 CSS Variables:');
  const cssVars = [
    'background', 'foreground', 'primary', 'primary-foreground',
    'secondary', 'secondary-foreground', 'card', 'card-foreground'
  ];
  
  cssVars.forEach(varName => {
    const value = root.style.getPropertyValue(`--${varName}`);
    console.log(`  --${varName}:`, value || 'not set');
  });
  
  // Check HTML classes
  console.log('🏷️ HTML Classes:', root.className);
  
  // Check computed styles
  console.log('💻 Computed Styles:');
  const computedStyle = getComputedStyle(root);
  cssVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(`--${varName}`);
    console.log(`  computed --${varName}:`, value || 'not set');
  });
  
  // Check browser info
  console.log('🌐 Browser Information:');
  console.log('  User Agent:', navigator.userAgent);
  console.log('  URL:', window.location.href);
  console.log('  Protocol:', window.location.protocol);
  console.log('  Host:', window.location.host);
  
  console.groupEnd();
};

// Add to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).debugTheme = debugTheme;
}

export default debugTheme;