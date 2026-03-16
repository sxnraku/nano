import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AudioProvider } from './services/audioService';

console.log("NANOVERSE: Initializing boot sequence...");

// Global error handling for mobile debugging
window.onerror = function(message, source, lineno, colno, error) {
  const errorMsg = `RUNTIME ERROR: ${message}\nSource: ${source}\nLine: ${lineno}:${colno}`;
  console.error(errorMsg, error);
  alert(errorMsg); // Catch errors even if React fails
  return false;
};

window.onunhandledrejection = function(event) {
  const msg = `PROMISE REJECTION: ${event.reason}`;
  console.error(msg);
  alert(msg);
};

const rootEl = document.getElementById('root');
if (rootEl) {
  console.log("NANOVERSE: Root element found, mounting React...");
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <AudioProvider>
          <App />
        </AudioProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error("NANOVERSE: Root element not found!");
  alert("CRITICAL ERROR: ROOT ELEMENT NOT FOUND");
}
