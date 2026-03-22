import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './authContext.tsx'; // Importar AuthProvider
import { Buffer } from 'buffer';

// Polyfills para Stellar SDK y Freighter
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  (window as any).global = window;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Envolver App con AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
