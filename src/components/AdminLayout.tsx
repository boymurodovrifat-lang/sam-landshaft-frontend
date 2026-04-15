import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Files, Upload, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function AdminLayout() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="text-lg font-bold">Sam-Landshaft</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin panel</div>
        </div>

        {admin && (
          <div className="px-5 py-3 border-b border-gray-800">
            <div className="text-sm font-medium truncate">{admin.name}</div>
            <div className="text-xs text-gray-400 truncate">{admin.email}</div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>
            <FolderKanban size={16} /> Kategoriyalar
          </NavLink>
          <NavLink to="/admin/files" className={navClass}>
            <Files size={16} /> Fayllar
          </NavLink>
          <NavLink to="/admin/upload" className={navClass}>
            <Upload size={16} /> Yuklash
          </NavLink>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-lg"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
