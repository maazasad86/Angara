import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Items from './pages/Items';
import POS from './pages/POS';
import Deals from './pages/Deals';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import { Agentation } from 'agentation';
// Simple Protected Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/categories" 
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/items" 
          element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <Dashboard /> {/* Placeholder for now */}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute>
              <POS />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/deals" 
          element={
            <ProtectedRoute>
              <Deals />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sales" 
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/expenses" 
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {import.meta.env.MODE === 'development' && (
        <Agentation 
          endpoint="http://localhost:4747"
          onSessionCreated={(sessionId) => {
            console.log("Session started:", sessionId);
          }}
        />
      )}
    </Router>
  );
}

export default App;
