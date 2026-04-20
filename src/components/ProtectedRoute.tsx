import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const checked = useRef(false);

  // Fonda token haqiqiyligini tekshirish (faqat birinchi marta)
  useEffect(() => {
    if (!token || checked.current) return;
    checked.current = true;

    authApi.me().then((a) => {
      setAuth(a, token);
    }).catch(() => {
      // Faqat 401 bo'lsa logout — network xatolik bo'lsa yo'q
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Token yo'q bo'lsa — login'ga yo'naltirish
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
