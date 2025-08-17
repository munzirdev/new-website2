// Test Admin Navigation
// This script helps debug admin navigation issues

console.log('🧪 Testing Admin Navigation...');

// Check if we're on an admin route
const isAdminRoute = window.location.pathname.startsWith('/admin');
console.log('📍 Current route:', window.location.pathname);
console.log('🔍 Is admin route:', isAdminRoute);

// Check for any console errors
const originalConsoleError = console.error;
console.error = function(...args) {
  console.log('❌ Console Error:', ...args);
  originalConsoleError.apply(console, args);
};

// Check for any console warnings
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  console.log('⚠️ Console Warning:', ...args);
  originalConsoleWarn.apply(console, args);
};

// Monitor navigation events
window.addEventListener('beforeunload', () => {
  console.log('🔄 Page is about to unload');
});

// Check for React Router state
if (window.__REACT_ROUTER__) {
  console.log('✅ React Router detected');
} else {
  console.log('❌ React Router not detected');
}

// Check for any loading states
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="animate-spin"]');
console.log('🔄 Loading elements found:', loadingElements.length);

// Check for admin dashboard elements
const adminElements = document.querySelectorAll('[class*="admin"], [class*="dashboard"]');
console.log('🔧 Admin elements found:', adminElements.length);

// Monitor network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch request:', args[0]);
  return originalFetch.apply(this, args);
};

console.log('✅ Admin Navigation Test Complete');
console.log('📝 Check the console for any errors or warnings');
