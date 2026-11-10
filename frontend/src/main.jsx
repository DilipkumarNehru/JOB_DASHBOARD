import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { VideoCallProvider } from './context/VideoCallContext.jsx';
import { DirectMessageProvider } from './context/DirectMessageContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VideoCallProvider>
          <DirectMessageProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
          </DirectMessageProvider>
        </VideoCallProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);