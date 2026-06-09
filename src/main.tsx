// App entry point — mounts <App/> inside the Router, Redux <Provider>, and Google OAuth provider.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import { NetraProvider } from './context/NetraContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import store from './store';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
        <Provider store={store}>
          <BrowserRouter>
            <NetraProvider>
              <App />
            </NetraProvider>
          </BrowserRouter>
        </Provider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
