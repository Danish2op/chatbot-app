//app.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NhostProvider, NhostReactProvider } from '@nhost/react';
import { NhostApolloProvider } from '@nhost/react-apollo';
import { nhost } from './utils/nhost';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <NhostProvider nhost={nhost}>
      <NhostReactProvider nhost={nhost}>
        <NhostApolloProvider nhost={nhost}>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:chatId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/chat" replace />} />
              </Routes>
            </div>
          </Router>
        </NhostApolloProvider>
      </NhostReactProvider>
    </NhostProvider>
  );
}

export default App;