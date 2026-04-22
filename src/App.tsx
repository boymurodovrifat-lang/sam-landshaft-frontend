import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

// Lazy loading — admin sahifalar faqat kerak bo'lganda yuklanadi
const MapPage = lazy(() => import('./pages/MapPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const isAdminSubdomain =
  typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route
            path="/"
            element={isAdminSubdomain ? <Navigate to="/admin" replace /> : <MapPage />}
          />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
