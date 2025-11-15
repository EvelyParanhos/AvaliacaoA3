import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // <-- IMPORTADO AQUI

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* O PROVIDER TEM DE FICAR AQUI, A ENVOLVER A APP TODA */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);