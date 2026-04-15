import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// admin.sam-landshaft.uz subdomenidan kirsa, avtomatik /admin ga olib o'tadi
const isAdminSubdomain =
  typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
