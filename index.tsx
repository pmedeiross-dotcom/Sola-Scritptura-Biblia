import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import ErrorBoundary from './src/components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch((error) => {
			console.error('Falha ao registrar service worker:', error);
		});
	});
}
