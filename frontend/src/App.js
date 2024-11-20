// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserReport from './pages/UserReport'; 
import Login from './pages/login';
import Register from './pages/register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import ResponseTeam from './pages/ResponseTeam';

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

const routesConfig = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/admin", element: <AdminPage />, protected: true, role: 'Admin' },
  { path: "/response", element: <ResponseTeam />, protected: true, role: 'Response' },
  { path: "/", element: <UserReport />, protected: true },  // Set UserReport as the new home page
  { path: "/user-report", element: <UserReport />, protected: true },
];

const AppRoutes = () => {
  const { loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {routesConfig.map(({ path, element, protected: isProtected, role }) => (
          <Route
            key={path}
            path={path}
            element={
              isProtected ? (
                role ? (
                  <RoleProtectedRoute allowedRoles={[role]}>{element}</RoleProtectedRoute>
                ) : (
                  <ProtectedRoute>{element}</ProtectedRoute>
                )
              ) : (
                element
              )
            }
          />
        ))}
      </Routes>
    </Router>
  );
};

export default App;
