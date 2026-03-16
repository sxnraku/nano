import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AudioProvider } from './services/audioService';

console.log("NANOVERSE: App starting...");

const rootEl = document.getElementById('root');
if (rootEl) {
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
  alert("CRITICAL ERROR: ROOT ELEMENT NOT FOUND");
}
