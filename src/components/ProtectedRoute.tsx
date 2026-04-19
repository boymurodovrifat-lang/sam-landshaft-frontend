import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    authApi
      .me()
      .then((admin) => {
        setAuth(admin, token);
        setValid(true);
      })
      .catch(() => {
        logout();
        setValid(false);
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Tekshirilmoqda...
      </div>
    );
  }

  if (!token || !valid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
