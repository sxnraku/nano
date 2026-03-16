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

// Visual Diagnostic Marker
const diagnosticDiv = document.createElement('div');
diagnosticDiv.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;z-index:9999;font-size:10px;padding:2px;pointer-events:none;';
diagnosticDiv.innerText = 'JS_EXEC';
document.body.appendChild(diagnosticDiv);

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
  diagnosticDiv.innerText = 'JS_MOUNTED';
} else {
  console.error("NANOVERSE: Root element not found!");
  alert("CRITICAL ERROR: ROOT ELEMENT NOT FOUND");
}
