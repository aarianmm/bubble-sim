import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './chrome/tokens.css';
import './chrome/bevel.css';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
