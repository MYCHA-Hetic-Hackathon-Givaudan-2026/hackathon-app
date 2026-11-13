import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTheme } from './lib/theme';
import './styles/tokens.css';
import './styles/explorer.css';
import './styles/landing.css';

initTheme();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Élément #root introuvable');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
