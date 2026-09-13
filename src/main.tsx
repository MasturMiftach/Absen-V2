import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for offline caching and instant updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Versi baru aplikasi tersedia.');
  },
  onOfflineReady() {
    console.log('Aplikasi siap digunakan dalam mode offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

