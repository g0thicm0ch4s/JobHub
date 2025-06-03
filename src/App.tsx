import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { storage } from './lib/storage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return storage.isAuthenticated() ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <div>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;