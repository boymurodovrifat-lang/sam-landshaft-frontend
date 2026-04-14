import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

function DashboardHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-gray-600">SamGeo admin panelga xush kelibsiz.</p>
    </div>
  );
}

function CategoriesPage() {
  return <div><h2 className="text-2xl font-bold">Kategoriyalar</h2><p>Tez orada...</p></div>;
}

function FilesPage() {
  return <div><h2 className="text-2xl font-bold">GeoTIFF fayllar</h2><p>Tez orada...</p></div>;
}

function UploadPage() {
  return <div><h2 className="text-2xl font-bold">Fayl yuklash</h2><p>Tez orada...</p></div>;
}

export default function AdminDashboard() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">SamGeo Admin</h1>
          {admin && <p className="text-sm text-gray-400 mt-1">{admin.email}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin" className="block px-3 py-2 rounded hover:bg-gray-800">
            Dashboard
          </Link>
          <Link to="/admin/categories" className="block px-3 py-2 rounded hover:bg-gray-800">
            Kategoriyalar
          </Link>
          <Link to="/admin/files" className="block px-3 py-2 rounded hover:bg-gray-800">
            Fayllar
          </Link>
          <Link to="/admin/upload" className="block px-3 py-2 rounded hover:bg-gray-800">
            Fayl yuklash
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
        >
          Chiqish
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 bg-gray-50">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}
