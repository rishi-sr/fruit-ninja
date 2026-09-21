import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.scss';
import './styles/animations.scss';
const rootElement = document.getElementById('root');

// Dynamic cache-invalidation to force browser tab to immediately show Fruit Ninja icon
try {
  document.querySelectorAll("link[rel*='icon']").forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('data:')) {
      link.href = `${href}${href.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }
  });
} catch (_) {}
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

