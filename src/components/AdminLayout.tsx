import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Files, Upload, LogOut, Map, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function AdminLayout() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">Sam-Landshaft</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin panel</div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {admin && (
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="text-sm font-medium truncate">{admin.name}</div>
          <div className="text-xs text-gray-400 truncate">{admin.email}</div>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1">
        <NavLink to="/admin" end className={navClass} onClick={handleNavClick}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/admin/categories" className={navClass} onClick={handleNavClick}>
          <FolderKanban size={16} /> Kategoriyalar
        </NavLink>
        <NavLink to="/admin/files" className={navClass} onClick={handleNavClick}>
          <Files size={16} /> Fayllar
        </NavLink>
        <NavLink to="/admin/upload" className={navClass} onClick={handleNavClick}>
          <Upload size={16} /> Yuklash
        </NavLink>
      </nav>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <a
          href="/"
          target="_blank"
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
        >
          <Map size={16} /> Xaritani ko'rish
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-lg"
        >
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu size={20} />
        </button>
        <span className="font-bold">Sam-Landshaft Admin</span>
        <div className="w-7" /> {/* Spacer */}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: doim, mobile: overlay */}
      <aside
        className={`
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white flex flex-col
          transition-transform duration-200 ease-in-out
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
