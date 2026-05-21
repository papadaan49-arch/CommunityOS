import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register standard PWA Service Worker for zero-cost offline resilience & installation banners
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('CommunityOS PWA ServiceWorker active:', reg.scope))
      .catch(err => console.error('PWA Registration error:', err));
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev mode safely to enable browser prompt testing
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('CommunityOS PWA ServiceWorker active (Dev):', reg.scope))
      .catch(err => console.error('PWA Registration error:', err));
  });
}
