import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Quita cualquier service worker que haya quedado de CodeDesk en este dominio (ver public/sw.js).
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((r) => r.unregister())));
}

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
