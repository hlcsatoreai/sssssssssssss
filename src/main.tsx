import React, {StrictMode, useState, useEffect, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>
        <h1>Ops! Qualcosa è andato storto.</h1>
        <p>L'applicazione non è riuscita ad avviarsi correttamente.</p>
        <pre style={{ background: '#eee', padding: '10px', borderRadius: '5px' }}>
          {error?.message || 'Errore sconosciuto'}
        </pre>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Ricarica Pagina
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
