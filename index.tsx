import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler for debugging blank screen
window.onerror = (message, source, lineno, colno, error) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.padding = '20px';
  errorDiv.style.color = 'red';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.whiteSpace = 'pre-wrap';
  errorDiv.innerHTML = `<h1>Runtime Error</h1><p>${message}</p><p>Source: ${source}:${lineno}:${colno}</p><pre>${error?.stack || ''}</pre>`;
  document.body.appendChild(errorDiv);
  return false;
};

const root = createRoot(rootElement);
root.render(
  <App />
);