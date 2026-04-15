import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DashboardPage from './admin/DashboardPage';
import CategoriesPage from './admin/CategoriesPage';
import UploadPage from './admin/UploadPage';
import FilesPage from './admin/FilesPage';

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="upload" element={<UploadPage />} />
      </Route>
    </Routes>
  );
}
